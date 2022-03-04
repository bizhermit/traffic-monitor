type Target = {
    name: string;
    title: string;
    host: string;
    community?: string;
    oids: Array<string>;
    version?: "1" | "2c" | "3";
    validation?: (value: any, index: number) => boolean;
    historySize?: number;
};

type $Target = Target & {
    results: Array<Array<any>>;
    session: any;
    $oids: Array<string>;
};

type Config = {
    targets: Array<Target>;
    historySize?: number;
};

type Varbind = {
    oid: string;
    type: number;
    value: any;
};
type VarbindError = {
    index: number;
    oid: string;
    value: any;
};