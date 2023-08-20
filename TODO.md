Der User sollte durch /register sich freischalten können. Danach sendet der Bot die ToS. Wenn der User diese mit Buttons akzeptiert, ist er eingetragen

Ab dann kann er Bilder senden. Wenn er fertig ist, kann er den Stack mit /cancel abbrechen oder mit /submit die Bilder einsenden. Diese werden in einen temp Ordner gespeichert. Wenn /cancel passiert, löscht der Bot die Bilder im Chat
Nach 30 Minuten ohne Aktivität wird der Vorgang abgebrochen und der Bot löscht die Bilder im Chat

Es wird erst in den Pending-Ordner gespeichert, wenn submitted wurde

# Register and Delete

## /register /delete

1. User muss die Terms akzeptieren
2. Useraccount angelegt, seine ID wird in users.json gespeichert

* Der User kann mit /info seine Daten einsehen
* Der User kann mit /delete seinen Account löschen, danach wird er nochmal gefragt, ob er es wirklich will. Er muss mit seinem Username bestätigen, dass er es wirklich will. /delete Username

# Sending Media

## /submit

1. Der User kann nun Bilder senden
2. Die Bilder werden im data/temp Ordner gespeichert

* Wenn der User fertig ist, kann er mit /cancel den Vorgang abbrechen
* Wenn der User fertig ist, kann er mit /submit confirm die Bilder einsenden und diese werden in den data/pending Ordner verschoben

# Status

## /status

* Der User kann sich den Status der Bilder ansehen
* Pro erfolgreichem Bild wird ein Punkt vergeben (Karma)
