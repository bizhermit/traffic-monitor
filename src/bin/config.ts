const config: Config = {
    targets: [{
        name: "NAME",
        host: "localhost",
        community: "private",
        version: "2c",
        oids: ["1.3.6.1.2.1.1.5.0"],
    }, {
        name: "RAM",
        host: "localhost",
        community: "private",
        version: "2c",
        oids: ["1.3.6.1.2.1.25.2.2.0"],
    }, {
        name: "Storage",
        host: "localhost",
        community: "private",
        version: "2c",
        oids: ["1.3.6.1.2.1.25.2.3.1.5", "1.3.6.1.2.1.25.2.3.1.6"]
    }],
};

export default config;