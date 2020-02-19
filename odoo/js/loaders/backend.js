// Copyright 2018-2020 Alexandre Díaz <dev@redneboa.es>
// License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

odoo.define("terminal.BackendLoader", function(require) {
    "use strict";

    const core = require("web.core");
    const Terminal = require("terminal.Terminal").terminal;
    const WebClientObj = require("web.web_client");

    // Ensure load resources
    require("terminal.CoreFunctions");
    require("terminal.CommonFunctions");
    require("terminal.BackendFunctions");

    // Detached initialization to ensure that the terminal loads on all
    // possible conditions
    $(function() {
        const terminal = new Terminal(WebClientObj);
        core.bus.on("toggle_terminal", this, () => {
            terminal.do_toggle();
        });

        // This is used to communicate to the extension that the widget
        // is initialized successfully.
        window.postMessage(
            {
                type: "ODOO_TERM_START",
            },
            "*"
        );
    });
});
