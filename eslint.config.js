module.exports = [
    {
        languageOptions: {
            globals: {
                document: "readonly",
                module: "readonly",
                window: "readonly",
                navigator: "readonly",
                console: "readonly",
                fetch: "readonly",
                setTimeout: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
        }
    }
];
