import type { App } from "..";

export default (app: App) => app.get("/test-some", "hi");
