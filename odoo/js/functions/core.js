// Copyright 2018-2020 Alexandre Díaz <dev@redneboa.es>
// License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

odoo.define("terminal.functions.Core", function (require) {
    "use strict";

    const Terminal = require("terminal.Terminal");
    const Utils = require("terminal.core.Utils");

    Terminal.include({
        init: function () {
            this._super.apply(this, arguments);

            this.registerCommand("help", {
                definition: "Print this help or command detailed info",
                callback: this._cmdPrintHelp,
                detail:
                    "Show commands and a quick definition.<br/>- " +
                    "<> ~> Required Parameter<br/>- [] ~> Optional Parameter",
                syntaxis: "[STRING: COMMAND]",
                args: "?s",
                example: "search",
            });
            this.registerCommand("clear", {
                definition: "Clean terminal section (screen by default)",
                callback: this._cmdClear,
                detail: "Available sections: screen (default), history.",
                syntaxis: "[STRING: SECTION]",
                args: "?s",
                example: "history",
            });
            this.registerCommand("print", {
                definition: "Print a message",
                callback: this._cmdPrintText,
                detail: "Eval parameters and print the result.",
                syntaxis: "<STRING: MSG>",
                args: "",
                aliases: ["echo"],
                example: "This is a example",
            });
            this.registerCommand("load", {
                definition: "Load external resource",
                callback: this._cmdLoadResource,
                detail: "Load external source (javascript & css)",
                syntaxis: "<STRING: URL>",
                args: "s",
                example: "https://example.com/libs/term_extra.js",
            });
            this.registerCommand("context_term", {
                definition: "Operations over terminal context dictionary",
                callback: this._cmdTerminalContextOperation,
                detail:
                    "Operations over terminal context dictionary. " +
                    "This context only affects to the terminal operations." +
                    "<br>[OPERATION] can be 'read', 'write' or 'set'. " +
                    "By default is 'read'. ",
                syntaxis: '[STRING: OPERATION] "[DICT: VALUES]" ',
                args: "?ss",
                example: "write \"{'the_example': 1}\"",
            });
            this.registerCommand("alias", {
                definition: "Create aliases",
                callback: this._cmdAlias,
                detail:
                    "Define aliases to run commands easy. " +
                    "<br><b>WARNING:</b> This command uses 'local storage' " +
                    "to persist the data even if you close the browser. " +
                    "This data can be easy accessed by other computer users. " +
                    "Don't use sensible data if you are using a shared " +
                    "computer." +
                    "<br><br>Can use positional parameters ($1,$2,$3,$N...)",
                syntaxis: "[STRING: ALIAS] [STRING: DEFINITION]",
                args: "?s*",
                sanitized: false,
                generators: false,
                example: 'myalias print "Hello, $1!"',
            });
            this.registerCommand("quit", {
                definition: "Close terminal",
                callback: this._cmdQuit,
                detail: "Close the terminal.",
            });
            this.registerCommand("exportvar", {
                definition:
                    "Exports the command result to a browser console variable",
                callback: this._cmdExport,
                detail:
                    "Exports the command result to a browser console variable.",
                syntaxis: "<STRING: COMMAND>",
                args: "*",
                sanitized: false,
                generators: false,
                example: "search res.partner",
            });
            this.registerCommand("exportfile", {
                definition: "Exports the command result to a text/json file",
                callback: this._cmdExportFile,
                detail: "Exports the command result to a text/json file.",
                syntaxis: "<STRING: COMMAND>",
                args: "*",
                sanitized: false,
                generators: false,
                example: "search res.partner",
            });
            this.registerCommand("chrono", {
                definition: "Print the time expended executing a command",
                callback: this._cmdChrono,
                detail:
                    "Print the elapsed time in seconds to execute a command. " +
                    "<br/>Notice that this time includes the time to format the result!",
                syntaxis: "<STRING: COMMAND>",
                args: "*",
                sanitized: false,
                generators: false,
                example: "search res.partner",
            });
            this.registerCommand("repeat", {
                definition: "Repeat a command N times",
                callback: this._cmdRepeat,
                detail: "Repeat a command N times.",
                syntaxis: "<INT: TIMES> <STRING: COMMAND>",
                args: "i*",
                sanitized: false,
                generators: false,
                example:
                    "20 create res.partner \"{'name': 'Example Partner #$INTITER'}\"",
            });
            this.registerCommand("mute", {
                definition: "Only prints errors",
                callback: this._cmdMute,
                detail:
                    "Print to screen is a really slow task, you can improve performance if only prints errors.",
                syntaxis: "<STRING: COMMAND>",
                args: "*",
                sanitized: false,
                generators: false,
                example:
                    "repeat 20 create res.partner \"{'name': 'Example Partner #$INTITER'}\"",
            });
            this.registerCommand("jobs", {
                definition: "Display running jobs",
                callback: this._cmdJobs,
                detail: "Display running jobs",
                syntaxis: "",
                args: "",
                sanitized: false,
                generators: false,
                example: "",
            });
        },

        _printWelcomeMessage: function () {
            this._super.apply(this, arguments);
            this.screen.print(
                "Type '<i class='o_terminal_click o_terminal_cmd' " +
                    "data-cmd='help'>help</i>' or '<i class='o_terminal_click " +
                    "o_terminal_cmd' data-cmd='help help'>help " +
                    "&lt;command&gt;</i>' to start."
            );
        },

        _printHelpSimple: function (cmd, cmd_def) {
            this.screen.print(
                this._templates.render("HELP_CMD", {
                    cmd: cmd,
                    def: cmd_def.definition,
                })
            );
        },

        _printHelpDetailed: function (cmd, cmd_def) {
            this.screen.print(cmd_def.detail);
            this.screen.print(" ");
            this.screen.eprint(`Syntaxis: ${cmd} ${cmd_def.syntaxis}`);
            if (cmd_def.example) {
                this.screen.eprint(`Example: ${cmd} ${cmd_def.example}`);
            }
        },

        _cmdPrintHelp: function (cmd) {
            if (typeof cmd === "undefined") {
                const sorted_cmd_keys = _.keys(this._registeredCmds).sort();
                const sorted_keys_len = sorted_cmd_keys.length;
                for (let x = 0; x < sorted_keys_len; ++x) {
                    const _cmd = sorted_cmd_keys[x];
                    this._printHelpSimple(_cmd, this._registeredCmds[_cmd]);
                }
            } else if (
                Object.prototype.hasOwnProperty.call(this._registeredCmds, cmd)
            ) {
                this._printHelpDetailed(cmd, this._registeredCmds[cmd]);
            } else {
                const [ncmd, cmd_def] = this._searchCommandDefByAlias(cmd);
                if (cmd_def) {
                    this.screen.print(
                        this._templates.render("DEPRECATED_COMMAND", {
                            cmd: ncmd,
                        })
                    );
                    this._printHelpDetailed(ncmd, this._registeredCmds[ncmd]);
                } else {
                    this.screen.printError(`'${cmd}' command doesn't exists`);
                }
            }
            return Promise.resolve();
        },

        _cmdClear: function (section) {
            if (section === "history") {
                this.cleanInputHistory();
            } else {
                this.screen.clean();
            }
            return Promise.resolve();
        },

        _cmdPrintText: function (...text) {
            const to_print = this._parameterReader.stringify(text);
            this.screen.print(to_print);
            return Promise.resolve(to_print);
        },

        _cmdLoadResource: function (url) {
            const inURL = new URL(url);
            const pathname = inURL.pathname.toLowerCase();
            if (pathname.endsWith(".js")) {
                return $.getScript(inURL.href);
            } else if (pathname.endsWith(".css")) {
                $("<link>").appendTo("head").attr({
                    type: "text/css",
                    rel: "stylesheet",
                    href: inURL.href,
                });
            } else {
                this.screen.printError("Invalid file type");
            }
            return Promise.resolve();
        },

        _cmdTerminalContextOperation: function (
            operation = "read",
            values = "false"
        ) {
            if (operation === "read") {
                this.screen.print(this._userContext);
            } else if (operation === "set") {
                this._userContext = JSON.parse(values);
                this.screen.print(this._userContext);
            } else if (operation === "write") {
                Object.assign(this._userContext, JSON.parse(values));
                this.screen.print(this._userContext);
            } else {
                this.screen.printError("Invalid operation");
            }
            return Promise.resolve();
        },

        _cmdAlias: function (name = false, ...defcall) {
            const aliases =
                this._storageLocal.getItem("terminal_aliases") || {};
            if (!name) {
                if (_.isEmpty(aliases)) {
                    this.screen.print("No aliases defined.");
                } else {
                    for (const alias_name in aliases) {
                        this.screen.printHTML(
                            ` - ${alias_name}  <small class="text-muted"><i>${aliases[alias_name]}</i></small>`
                        );
                    }
                }
            } else if (name in this._registeredCmds) {
                this.screen.printError("Invalid alias name");
            } else {
                if (_.some(defcall)) {
                    aliases[name] = this._parameterReader.stringify(defcall);
                    this.screen.print("Alias created successfully");
                } else {
                    delete aliases[name];
                    this.screen.print("Alias removed successfully");
                }
                this._storageLocal.setItem("terminal_aliases", aliases, (err) =>
                    this.screen.printHTML(err)
                );
            }
            return Promise.resolve();
        },

        _cmdQuit: function () {
            this.doHide();
            return Promise.resolve();
        },

        _validateDefCommand: function (defcall) {
            if (!_.some(defcall)) {
                return [false, false];
            }
            const cmd = this._parameterReader.stringify(defcall);
            return this.validateCommand(cmd);
        },

        _cmdExport: function (...defcall) {
            return new Promise(async (resolve, reject) => {
                try {
                    // eslint-disable-next-line
                    const [cmd, cmd_name] = this._validateDefCommand(
                        defcall
                    )[1];
                    if (!cmd_name) {
                        return reject("Need a valid command to execute!");
                    }
                    const varname = _.uniqueId("term");
                    window[varname] = await this._cmdMute(...defcall);
                    this.screen.print(
                        `Command result exported! now you can use '${varname}' variable in the browser console`
                    );
                } catch (err) {
                    return reject(err);
                }
                return resolve();
            });
        },

        _cmdExportFile: function (...defcall) {
            return new Promise(async (resolve, reject) => {
                try {
                    // eslint-disable-next-line
                    const [cmd, cmd_name] = this._validateDefCommand(
                        defcall
                    )[1];
                    if (!cmd_name) {
                        return reject("Need a valid command to execute!");
                    }
                    const filename = `${cmd_name}_${new Date().getTime()}.json`;
                    const result = await this._cmdMute(...defcall);
                    Utils.save2File(
                        filename,
                        "text/json",
                        JSON.stringify(result, null, 4)
                    );
                    this.screen.print(
                        `Command result exported to '${filename}' file`
                    );
                } catch (err) {
                    return reject(err);
                }
                return resolve();
            });
        },

        _cmdChrono: function (...defcall) {
            return new Promise(async (resolve, reject) => {
                try {
                    const [cmd, cmd_name] = this._validateDefCommand(defcall);
                    if (!cmd_name) {
                        return reject("Need a valid command to execute!");
                    }
                    const cmd_def = this._registeredCmds[cmd_name];
                    const scmd = this._parameterReader.parse(cmd, cmd_def);
                    const start_time = new Date();
                    await this._processCommandJob(scmd, cmd_def);
                    const time_elapsed_secs =
                        (new Date() - start_time) / 1000.0;
                    this.screen.print(
                        `Time elapsed: '${time_elapsed_secs}' seconds`
                    );
                } catch (err) {
                    return reject(err);
                }
                return resolve();
            });
        },

        _cmdRepeat: function (times, ...defcall) {
            return new Promise((resolve, reject) => {
                if (times < 0) {
                    return reject("'Times' parameter must be positive");
                }
                const [cmd, cmd_name] = this._validateDefCommand(defcall);
                if (!cmd_name) {
                    return reject("Need a valid command to execute!");
                }
                const cmd_def = this._registeredCmds[cmd_name];
                const do_repeat = (rtimes) => {
                    if (!rtimes) {
                        this.screen.print(
                            `<i>** Repeat finsihed: command called ${times} times</i>`
                        );
                        return resolve();
                    }
                    const scmd = this._parameterReader.parse(cmd, cmd_def);
                    this._processCommandJob(scmd, cmd_def).finally(() =>
                        do_repeat(rtimes - 1)
                    );
                };
                do_repeat(times);
            });
        },

        _cmdMute: function (...defcall) {
            const [cmd, cmd_name] = this._validateDefCommand(defcall);
            if (!cmd_name) {
                return Promise.reject("Need a valid command to execute!");
            }

            var _this = _.clone(this);
            _this.screen = _.clone(this.screen);
            // Monkey-Patch screen print
            _this.screen.print = () => {
                // Do nothing.
            };

            const cmd_def = this._registeredCmds[cmd_name];
            const scmd = this._parameterReader.parse(cmd, cmd_def);
            return this._processCommandJob.call(_this, scmd, cmd_def);
        },

        _cmdJobs: function () {
            const jobs = _.compact(this._jobs);
            this.screen.print(
                _.map(
                    jobs,
                    (item) =>
                        `${item.scmd.cmd} <small><i>${
                            item.scmd.rawParams
                        }</i></small> ${
                            item.healthy
                                ? ""
                                : '<span class="text-warning">This job is taking a long time</span>'
                        }`
                )
            );
            return Promise.resolve();
        },
    });
});
