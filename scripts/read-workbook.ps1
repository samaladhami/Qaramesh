Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead('C:/Users/samal/Downloads/Qaramesh.xlsx')
function Read-Entry($name) { $reader = [IO.StreamReader]::new($zip.GetEntry($name).Open()); $value = $reader.ReadToEnd(); $reader.Dispose(); return $value }
[xml]$shared = Read-Entry 'xl/sharedStrings.xml'
$strings = @($shared.sst.si | ForEach-Object { $_.InnerText })
$result = @{}
foreach ($sheet in 1,2,3) {
 [xml]$xml = Read-Entry "xl/worksheets/sheet$sheet.xml"
 $rows = @($xml.worksheet.sheetData.row | ForEach-Object {
  $row = @{}
  foreach ($cell in $_.c) { $column = $cell.r -replace '\d',''; $value = $cell.v; if ($cell.t -eq 's') { $value = $strings[[int]$value] }; if ($cell.t -eq 'inlineStr') { $value = $cell.is.InnerText }; $row[$column] = $value }
  $row
 })
 $label = @{1="Sheet1";2="Sheet3";3="Sheet4"}[$sheet]; $result[$label] = $rows
}
$result | ConvertTo-Json -Depth 8 | Set-Content data/workbook-raw.json -Encoding utf8
$zip.Dispose()

