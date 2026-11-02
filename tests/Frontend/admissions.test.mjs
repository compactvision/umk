import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../../resources/js/lib/admissions.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const { calculateAcademicFees, admissionFaculties } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const published = [
    ['medicine', 'national', 450, 353, 803],
    ['medicine', 'international', 650, 553, 1203],
    ['public-health', 'national', 270, 185, 455],
    ['public-health', 'international', 370, 235, 605],
    ['law', 'national', 250, 155, 405],
    ['law', 'international', 370, 235, 605],
    ['social-sciences', 'national', 250, 155, 405],
    ['social-sciences', 'international', 370, 235, 605],
    ['theology', 'national', 250, 155, 405],
    ['theology', 'international', 370, 235, 605],
];
for (const [faculty, category, first, second, total] of published) {
    test(`Barème officiel : ${faculty}, ${category}`, () => assert.deepEqual(calculateAcademicFees(faculty, category), { first, second, total }));
}
test('Le régime spécial remplace le barème ordinaire sans cumul', () => {
    for (const faculty of admissionFaculties) {
        assert.deepEqual(calculateAcademicFees(faculty.id, 'national', 'special'), { first: 190, second: 205, total: 395 });
        assert.deepEqual(calculateAcademicFees(faculty.id, 'international', 'special'), { first: 190, second: 305, total: 495 });
    }
});
test('Les frais académiques ne cumulent pas les frais annexes', () => {
    const medicine = admissionFaculties.find((f) => f.id === 'medicine');
    assert.equal(
        medicine.extras.reduce((sum, item) => sum + item.amount, 0),
        195,
    );
    assert.equal(calculateAcademicFees('medicine', 'national').total, 803);
});
test('L’écart publié en santé publique reste visible sans correction inventée', () => {
    const health = admissionFaculties.find((f) => f.id === 'public-health');
    assert.equal(health.publishedExtras, 135);
    assert.equal(
        health.extras.reduce((sum, item) => sum + item.amount, 0),
        140,
    );
    assert.match(health.extraNote, /135.*140/);
});
test('Une faculté inconnue ne produit pas une estimation trompeuse', () => {
    assert.throws(() => calculateAcademicFees('unknown', 'national'), /Faculté inconnue/);
});
