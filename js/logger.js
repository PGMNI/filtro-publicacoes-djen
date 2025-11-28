export default class Logger {
    logs = [];

    add(icon = "", msg = "") {
        this.logs.push({ icon, msg });
    }

    clear() {
        this.logs.length = 0;
    }
}