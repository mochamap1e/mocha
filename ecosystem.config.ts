import type { StartOptions } from "pm2";

export const apps: StartOptions[] = [
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