var PlayerList = class PlayerList {
    constructor(game) {
        this.game = game;
    }

    update(players) {
        $(".player_list").empty();

        for (let username of Object.keys(players)) {
            // This order to sanitize player names and prevent XSS
            $("<span></span>")
                .addClass(
                    "mdi mdi-signal-cellular-" +
                        (players[username].ping < 0
                            ? "outline"
                            : players[username].ping >= 1000
                            ? "1"
                            : players[username].ping >= 600
                            ? "2"
                            : players[username].ping >= 300
                            ? "3"
                            : "3")
                )
                .css("margin-left", "5px")
                .appendTo(
                    $("<span class='player_list_entry'></span>")
                        .text(username)
                        .appendTo(".player_list")
                );
        }
    }

    setOpenState(open) {
        $(".player_list").css("display", open ? "flex" : "none");
    }
};

export { PlayerList };
