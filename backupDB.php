<?php

const $RAW_PATH = __DIR__ . '/../../../webroots/r1434796/FireBaseRTdb_JSON_key';
$path = realpath($RAW_PATH);

include $path.'/backupFSdb.php';
include $path.'/backupRTdb.php';