#! /usr/bin/env node

import DatetimeUtils from "@bizhermit/basic-utils/dist/datetime-utils";
import { getKeyArg, hasKeyArg, wl } from "@bizhermit/cli-sdk";
import { scheduleJob } from "node-schedule";
import path from "path";
import { existsSync, mkdirSync, readFile, readFileSync, writeFile } from "fs-extra";
import ArrayUtils from "@bizhermit/basic-utils/dist/array-utils";
import config from "./config";
import StringUtils from "@bizhermit/basic-utils/dist/string-utils";
const snmp = require("net-snmp");

const datetimePattern = "yyyy/MM/dd hh:mm:ss.SSS";
const isDev = hasKeyArg("--dev");

const cacheDir = path.join(getKeyArg("-dir") || process.cwd(), "cache");
if (!existsSync(cacheDir)) mkdirSync(cacheDir);
const targets = config.targets as Array<Target>;
const $targets: Array<$Target> = [];

const getVersionObject = (target: Target) => {
    if (StringUtils.isEmpty(target.version)) return snmp.Version3;
    if (target.version === "3") return snmp.Version3;
    if (target.version === "2c") return snmp.Version2c;
    if (target.version === "1") return snmp.Version1;
    return snmp.Version3;
};

const histSize = config.historySize ?? 60 * 3;
targets.forEach((target) => {
    const session = target.version === "3" ?
        snmp.createV3Session(target.host, { // TODO:
            name: "",
            level: snmp.SecurityLevel.noAuthNoPriv,
            authProtocol: snmp.AuthProtocols.sha,
            authKey: "",
            privProtocol: snmp.PrivProtocols.des,
            privKey: ""
        }, {
            port: 161,
            retries: 1,
            timeout: 2000,
            transport: "udp4",
            trapPort: 162,
            version: snmp.Version3,
            engineId: undefined,
            idBitsSize: 32,
            context: "",
        })
    :   snmp.createSession(target.host, target.community || "public", {
            port: 161,
            retries: 1,
            timeout: 2000,
            backoff: 1.0,
            transport: "udp4",
            trapPort: 162,
            version: getVersionObject(target),
            backwardsGetNexts: true,
            idBitsSize: 63,
        });
    const oids = target.oids;
    const $oids = oids.map(oid => {
        return oid.
            replace("itu-t", "0")
            .replace("iso", "1")
            .replace("joint-iso-itu-t", "2");
    });
    const results = ArrayUtils.generateArray(oids.length, () => {
        return ArrayUtils.generateArray(target.historySize ?? histSize, undefined);
    });
    $targets.push({...target, session, results, $oids });
});

// console.log(JSON.stringify($targets[1], null, 2));

const analyzeValue = (value: any) => {
    if (value == null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "bigint"
    ) return value;

    if (Buffer.isBuffer(value)) {
        return value.toString();
    }
    return value;
};

const scanError = async (target: $Target, error: any) => {
    process.stderr.write(`ERROR: ${target.name}\n> ${String(error.message ?? error).replace(/\n/g, "\n")}\n`);
};

const validationError = async (target: $Target, errors: Array<VarbindError>) => {
    process.stderr.write(`ERROR: ${target.name}\n${JSON.stringify(errors, null, 2)}\n`);
};

const scan = async (closeSession?: boolean) => {
    const beginDatetime = new Date();
    wl(`# scan ${DatetimeUtils.format(beginDatetime, datetimePattern)}`);
    try {
        $targets.forEach(target => {
            target.session.get(target.$oids, (err: any, varbinds: Array<Varbind>) => {
                if (err) {
                    scanError(target, err);
                    target.results.forEach(result => {
                        result.shift();
                        result.push(undefined);
                    });
                } else {
                    const errors: Array<VarbindError> = [];
                    varbinds.forEach((varbind, varbindIndex) => {
                        const result = target.results[varbindIndex];
                        result.shift();
                        const val = analyzeValue(varbind.value);
                        result.push(val);
                        const ret = target.validation?.(val, varbindIndex);
                        if (ret === false) {
                            errors.push({ index: varbindIndex, oid: varbind.oid, value: val });
                        }
                    });
                    if (errors.length > 0) validationError(target, errors);
                }
                writeFile(path.join(cacheDir, target.name), JSON.stringify(target.results));
                if (closeSession) {
                    try {
                        target.session?.close();
                    } catch {}
                }
                wl(`  end: ${target.name}`);
            });
        });
    } catch(err) {
        process.stderr.write(String(err));
    }
}

if (isDev) {
    scan(true);
} else {
    const rule = "*/1 * * * *";
    scheduleJob(rule, () => {
        scan();
    });
    wl(`# begin monitor: ${DatetimeUtils.format(new Date(), datetimePattern)}`);
    wl(`  rule: ${rule}`);
}
