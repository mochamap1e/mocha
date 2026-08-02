/** @type {import("pm2").StartOptions[]} */
export const apps = [
    {
        name: "bot",
        script: "./src/index.ts",
        interpreter: "bun",
        interpreter_args: "--smol",
        args: "run start",
        exec_mode: "fork",
        watch: false
    }
]
