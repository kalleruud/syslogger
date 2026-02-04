INSERT INTO
  syslogs (
    timestamp,
    facility,
    severity,
    hostname,
    appname,
    procid,
    msgid,
    message,
    raw
  )
VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?)