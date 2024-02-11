export function checkEnvVariables() {
    return (!!process.env.DB_HOST && !!process.env.DB_USER && !!process.env.DB_PASS && !!process.env.DB_NAME && !!process.env.DB_PORT);
}