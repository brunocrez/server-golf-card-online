-- CreateTable
CREATE TABLE "lobby" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "host" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "max_players" INTEGER NOT NULL,
    "current_players" INTEGER NOT NULL,
    "rounds" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nickname" TEXT NOT NULL,
    "lobby_id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "player_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "lobby" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
