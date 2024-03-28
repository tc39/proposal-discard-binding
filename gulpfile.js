const del = require("del");
const path = require("path");
const gulp = require("gulp");
const emu = require("gulp-emu");
const rename = require("gulp-rename");
const gls = require("gulp-live-server");

gulp.task("clean", () => del("build/**/*"));

gulp.task("build", () => gulp
    .src(["spec.emu"])
    .pipe(emu({
        log: require("ecmarkup/lib/utils").logVerbose,
        warn: err => {
            const file = path.resolve(err.file || "spec.emu");
            const message = `Warning: ${file}:${typeof err.line === "number" ? `${err.line}:${err.column}:` : ""} ${err.message}`;
            require("ecmarkup/lib/utils").logWarning(message);
        },
        ecma262Biblio: false,
    }))
    .pipe(rename("index.html"))
    .pipe(gulp.dest("build")));

gulp.task("watch", () => gulp
    .watch(["spec.emu"], gulp.task("build")));

gulp.task("start", gulp.parallel("watch", () => {
    const server = gls.static("build", 8080);
    const promise = server.start();
    (/** @type {import("chokidar").FSWatcher}*/(gulp.watch(["build/**/*"])))
        .on("change", file => {
            server.notify({ path: path.resolve(file) });
        });
    return promise;
}));

gulp.task("default", gulp.task("build"));