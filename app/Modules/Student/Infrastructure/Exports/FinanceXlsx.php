<?php

namespace App\Modules\Student\Infrastructure\Exports;

use App\Modules\Student\Application\Services\Money;
use Carbon\CarbonImmutable;
use RuntimeException;
use ZipArchive;

final class FinanceXlsx
{
    private const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

    private const SHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

    private const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

    private const PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';

    private const MIME_PREFIX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.';

    private const HEADER_ROW = 6;

    public function package(array $sheets, string $scope): string
    {
        $parts = [];
        $types = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="'.self::MIME_PREFIX.'sheet.main+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="'.self::MIME_PREFIX.'styles+xml"/>';
        $workbook = '<workbook xmlns="'.self::SHEET_NS.'" xmlns:r="'.self::REL_NS.'"><bookViews><workbookView activeTab="0"/></bookViews><sheets>';
        $relations = '<Relationships xmlns="'.self::PACKAGE_REL_NS.'">'
            .'<Relationship Id="styles" Type="'.self::REL_NS.'/styles" Target="styles.xml"/>';

        foreach ($sheets as $index => $sheet) {
            $id = $index + 1;
            $path = 'worksheets/sheet'.$id.'.xml';
            $workbook .= '<sheet name="'.$this->escape($sheet['name']).'" sheetId="'.$id.'" r:id="sheet'.$id.'"/>';
            $relations .= '<Relationship Id="sheet'.$id.'" Type="'.self::REL_NS.'/worksheet" Target="'.$path.'"/>';
            $types .= '<Override PartName="/xl/'.$path.'" ContentType="'.self::MIME_PREFIX.'worksheet+xml"/>';
            $parts['xl/'.$path] = $this->worksheet($sheet, $scope);
        }

        return $this->zip([
            '[Content_Types].xml' => $types.'</Types>',
            '_rels/.rels' => '<Relationships xmlns="'.self::PACKAGE_REL_NS.'">'
                .'<Relationship Id="workbook" Type="'.self::REL_NS.'/officeDocument" Target="xl/workbook.xml"/>'
                .'</Relationships>',
            'xl/workbook.xml' => $workbook.'</sheets></workbook>',
            'xl/_rels/workbook.xml.rels' => $relations.'</Relationships>',
            'xl/styles.xml' => $this->styles(),
            ...$parts,
        ]);
    }

    private function zip(array $parts): string
    {
        $filename = tempnam(sys_get_temp_dir(), 'umk-xlsx-');
        if ($filename === false) {
            throw new RuntimeException('Impossible de préparer le classeur Excel.');
        }

        try {
            $archive = new ZipArchive;
            if ($archive->open($filename, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new RuntimeException('Impossible de créer le classeur Excel.');
            }
            foreach ($parts as $path => $xml) {
                if (! $archive->addFromString($path, self::XML.$xml)) {
                    throw new RuntimeException('Impossible d’ajouter une feuille au classeur Excel.');
                }
            }
            if (! $archive->close()) {
                throw new RuntimeException('Impossible de finaliser le classeur Excel.');
            }
            $bytes = file_get_contents($filename);
            if ($bytes === false) {
                throw new RuntimeException('Impossible de lire le classeur Excel.');
            }

            return $bytes;
        } finally {
            unset($archive);
            unlink($filename);
        }
    }

    private function worksheet(array $sheet, string $scope): string
    {
        $columns = $sheet['columns'];
        $lastColumn = $this->column(count($columns) - 1);
        $firstDataRow = self::HEADER_ROW + 1;
        $lastRow = self::HEADER_ROW + max(1, count($sheet['rows']));
        $pane = $this->column($sheet['freeze']).$firstDataRow;
        $xml = '<worksheet xmlns="'.self::SHEET_NS.'">'
            .'<sheetPr><tabColor rgb="FF20664D"/></sheetPr>'
            .'<dimension ref="A1:'.$lastColumn.$lastRow.'"/>'
            .'<sheetViews><sheetView showGridLines="0" workbookViewId="0">'
            .'<pane xSplit="'.$sheet['freeze'].'" ySplit="'.self::HEADER_ROW.'" topLeftCell="'.$pane.'" activePane="bottomRight" state="frozen"/>'
            .'<selection pane="bottomRight" activeCell="'.$pane.'" sqref="'.$pane.'"/>'
            .'</sheetView></sheetViews><sheetFormatPr defaultRowHeight="21"/><cols>';
        $header = '';
        $index = 0;
        foreach ($columns as [$label, $width]) {
            $index++;
            $xml .= '<col min="'.$index.'" max="'.$index.'" width="'.$width.'" customWidth="1"/>';
            $header .= $this->inlineCell($this->column($index - 1).self::HEADER_ROW, $label, 4);
        }

        $xml .= '</cols><sheetData>';
        $banners = [
            1 => [$sheet['title'], 31, 1],
            2 => ['Université Simon Kimbangu', 20, 2],
            3 => [$scope, 34, 3],
            4 => [$sheet['note'], 32, 3],
        ];
        foreach ($banners as $row => [$value, $height, $style]) {
            $xml .= $this->row($row, $height, $this->inlineCell('A'.$row, $value, $style));
        }
        $xml .= $this->row(5, 8, '').$this->row(self::HEADER_ROW, 32, $header);
        foreach ($sheet['rows'] as $index => $entry) {
            $row = $firstDataRow + $index;
            $cells = '';
            $column = 0;
            foreach ($columns as $key => $definition) {
                $cells .= $this->dataCell($this->column($column++).$row, $entry[$key] ?? null, $definition[2] ?? 'label', $index % 2);
            }
            $xml .= $this->row($row, 23, $cells);
        }

        $merge = [1, 2, 3, 4];
        if ($sheet['rows'] === []) {
            $xml .= $this->row($firstDataRow, 25, $this->inlineCell('A'.$firstDataRow, 'Aucune donnée pour ce périmètre.', 3));
            $merge[] = $firstDataRow;
        }
        $xml .= '</sheetData>';
        if ($sheet['rows'] !== []) {
            $xml .= '<autoFilter ref="A'.self::HEADER_ROW.':'.$lastColumn.$lastRow.'"/>';
        }
        $xml .= '<mergeCells count="'.count($merge).'">';
        foreach ($merge as $row) {
            $xml .= '<mergeCell ref="A'.$row.':'.$lastColumn.$row.'"/>';
        }
        $xml .= '</mergeCells>'.$this->dataBars($sheet);

        return $xml.'</worksheet>';
    }

    private function dataBars(array $sheet): string
    {
        if (! isset($sheet['bar'])) {
            return '';
        }

        $column = $this->column(array_search($sheet['bar'], array_keys($sheet['columns']), true));
        $ranges = [];
        foreach ($sheet['rows'] as $index => $entry) {
            $row = self::HEADER_ROW + 1 + $index;
            $currency = $entry['currency'];
            $ranges[$currency][0] ??= $row;
            $ranges[$currency][1] = $row;
        }

        $xml = '';
        $priority = 1;
        foreach ($ranges as [$first, $last]) {
            if ($first < $last) {
                $xml .= '<conditionalFormatting sqref="'.$column.$first.':'.$column.$last.'">'
                    .'<cfRule type="dataBar" priority="'.$priority++.'"><dataBar minLength="0" maxLength="100">'
                    .'<cfvo type="num" val="0"/><cfvo type="max"/><color rgb="FF80B89A"/>'
                    .'</dataBar></cfRule></conditionalFormatting>';
            }
        }

        return $xml;
    }

    private function row(int $row, int $height, string $cells): string
    {
        return '<row r="'.$row.'" ht="'.$height.'" customHeight="1">'.$cells.'</row>';
    }

    private function dataCell(string $reference, mixed $value, string $kind, int $stripe): string
    {
        $style = match ($kind) {
            'amount' => 7,
            'month' => 9,
            'percent' => 11,
            default => 5,
        } + $stripe;
        if ($value === null) {
            return '<c r="'.$reference.'" s="'.$style.'"/>';
        }
        if ($kind === 'label') {
            return $this->inlineCell($reference, (string) $value, $style);
        }

        $number = match ($kind) {
            'amount' => Money::decimal($value),
            'month' => 25569 + intdiv(CarbonImmutable::parse($value.'-01', 'UTC')->timestamp, 86400),
            'percent' => number_format($value, 10, '.', ''),
        };

        return '<c r="'.$reference.'" s="'.$style.'"><v>'.$number.'</v></c>';
    }

    private function inlineCell(string $reference, string $value, int $style): string
    {
        // An inline string preserves literal titles even when they start with an Excel formula character.
        return '<c r="'.$reference.'" s="'.$style.'" t="inlineStr"><is><t xml:space="preserve">'
            .$this->escape($value).'</t></is></c>';
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES | ENT_DISALLOWED | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function column(int $index): string
    {
        $column = '';
        do {
            $column = chr(65 + $index % 26).$column;
            $index = intdiv($index, 26) - 1;
        } while ($index >= 0);

        return $column;
    }

    private function styles(): string
    {
        return <<<'XML'
            <styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
              <numFmts count="3">
                <numFmt numFmtId="164" formatCode="#,##0.00;[Red](#,##0.00);&quot;–&quot;"/>
                <numFmt numFmtId="165" formatCode="mmm yyyy"/>
                <numFmt numFmtId="166" formatCode="0.0%"/>
              </numFmts>
              <fonts count="4">
                <font><sz val="11"/><color rgb="FF193C31"/><name val="Calibri"/></font>
                <font><b/><sz val="22"/><color rgb="FFFFFEFA"/><name val="Calibri"/></font>
                <font><b/><sz val="12"/><color rgb="FF20664D"/><name val="Calibri"/></font>
                <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
              </fonts>
              <fills count="5">
                <fill><patternFill patternType="none"/></fill>
                <fill><patternFill patternType="gray125"/></fill>
                <fill><patternFill patternType="solid"><fgColor rgb="FF153E31"/><bgColor indexed="64"/></patternFill></fill>
                <fill><patternFill patternType="solid"><fgColor rgb="FF286851"/><bgColor indexed="64"/></patternFill></fill>
                <fill><patternFill patternType="solid"><fgColor rgb="FFF0F6EF"/><bgColor indexed="64"/></patternFill></fill>
              </fills>
              <borders count="2">
                <border><left/><right/><top/><bottom/><diagonal/></border>
                <border><left/><right/><top/><bottom style="thin"><color rgb="FFDDE9E0"/></bottom><diagonal/></border>
              </borders>
              <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
              <cellXfs count="13">
                <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
                <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
                <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
                <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf>
                <xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf>
                <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
                <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyBorder="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
                <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
                <xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0" applyBorder="1" applyFill="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
                <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="1"/></xf>
                <xf numFmtId="165" fontId="0" fillId="4" borderId="1" xfId="0" applyBorder="1" applyFill="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="1"/></xf>
                <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
                <xf numFmtId="166" fontId="0" fillId="4" borderId="1" xfId="0" applyBorder="1" applyFill="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
              </cellXfs>
              <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
            </styleSheet>
            XML;
    }
}
