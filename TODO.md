Der User sollte durch /register sich freischalten können.

Wenn er fertig ist, kann er den Stack mit /cancel abbrechen oder mit /submit die Bilder einsenden. Diese werden in einen temp Ordner gespeichert
Nach 30 Minuten ohne Aktivität wird der Vorgang abgebrochen

Es wird erst in die Datei gespeichert, wenn submitted wurde

# Register and Delete

1. /register
2. User muss die Terms akzeptieren
3. Useraccount angelegt, seine ID wird in users.json gespeichert
4. Der User kann mit /info seine Daten einsehen
5. Der User kann mit /delete seinen Account löschen, danach wird er nochmal gefragt, ob er es wirklich will. Er muss mit seinem Username bestätigen, dass er es wirklich will. /delete Username

# Sending Media
1. /submit
2. Der User kann nun Bilder senden
3. Die Bilder werden im data/temp Ordner gespeichert
4. Wenn der User fertig ist, kann er mit /cancel den Vorgang abbrechen
5. Wenn der User fertig ist, kann er mit /submit confirm die Bilder einsenden
6. Die Bilder werden in den data/pending Ordner verschoben

# Status
1. /status
2. Der User kann sich den Status der Bilder ansehen
3. Pro erfolgreichem Bild wird ein Punkt vergeben (Karma)
