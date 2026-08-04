const SHEETS = {
  meta: 'Meta',
  students: 'Students',
  rounds: 'Rounds',
  records: 'Records',
};

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets_(spreadsheet);

    if (action === 'saveAll') {
      saveAll_(spreadsheet, payload.data);
      return json_({ ok: true, message: '已同步到 Google Sheet。' });
    }

    if (action === 'loadAll') {
      return json_({ ok: true, message: '已讀取 Google Sheet。', data: loadAll_(spreadsheet) });
    }

    return json_({ ok: false, message: '未知的同步指令。' });
  } catch (error) {
    return json_({ ok: false, message: String(error && error.message ? error.message : error) });
  }
}

function doGet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets_(spreadsheet);
  return json_({ ok: true, message: 'TeamPro Google Sheet backend is ready.', data: loadAll_(spreadsheet) });
}

function ensureSheets_(spreadsheet) {
  Object.values(SHEETS).forEach((name) => {
    if (!spreadsheet.getSheetByName(name)) spreadsheet.insertSheet(name);
  });
}

function saveAll_(spreadsheet, data) {
  if (!data || data.version !== 1 || !Array.isArray(data.students) || !Array.isArray(data.rounds) || !Array.isArray(data.records)) {
    throw new Error('資料格式錯誤。');
  }

  writeObjects_(spreadsheet.getSheetByName(SHEETS.meta), [
    { key: 'version', value: data.version },
    { key: 'teamName', value: data.settings.teamName },
    { key: 'currentRoundId', value: data.settings.currentRoundId },
    { key: 'updatedAt', value: new Date().toISOString() },
  ], ['key', 'value']);

  writeObjects_(spreadsheet.getSheetByName(SHEETS.students), data.students, ['id', 'name', 'grade', 'note', 'createdAt']);
  writeObjects_(spreadsheet.getSheetByName(SHEETS.rounds), data.rounds, ['id', 'title', 'startDate', 'endDate', 'isActive', 'createdAt']);
  writeObjects_(spreadsheet.getSheetByName(SHEETS.records), data.records.map((record) => ({
    ...record,
    answers: JSON.stringify(record.answers),
  })), [
    'id',
    'studentId',
    'roundId',
    'role',
    'answers',
    'totalScore',
    'bestItem',
    'improvementItem',
    'bestReflection',
    'improvementReflection',
    'nextAction',
    'createdAt',
  ]);
}

function loadAll_(spreadsheet) {
  const meta = readObjects_(spreadsheet.getSheetByName(SHEETS.meta));
  const settings = {
    teamName: findMeta_(meta, 'teamName') || 'TeamPro',
    currentRoundId: findMeta_(meta, 'currentRoundId') || '',
  };

  return {
    version: 1,
    students: readObjects_(spreadsheet.getSheetByName(SHEETS.students)),
    rounds: readObjects_(spreadsheet.getSheetByName(SHEETS.rounds)).map((round) => ({
      ...round,
      isActive: round.isActive === true || round.isActive === 'TRUE' || round.isActive === 'true',
    })),
    records: readObjects_(spreadsheet.getSheetByName(SHEETS.records)).map((record) => ({
      ...record,
      totalScore: Number(record.totalScore),
      answers: JSON.parse(record.answers || '[]'),
    })),
    settings,
  };
}

function writeObjects_(sheet, rows, headers) {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length === 0) return;
  const values = rows.map((row) => headers.map((header) => row[header] === undefined ? '' : row[header]));
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  sheet.autoResizeColumns(1, headers.length);
}

function readObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter((row) => row.some((cell) => cell !== '')).map((row) => {
    const item = {};
    headers.forEach((header, index) => item[header] = row[index]);
    return item;
  });
}

function findMeta_(meta, key) {
  const row = meta.find((item) => item.key === key);
  return row ? row.value : '';
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
