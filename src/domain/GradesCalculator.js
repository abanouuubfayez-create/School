        function calcTotalWithMercy(sid, term, stage) {
            const raw = calcTotal(sid, term, stage);
            const max = getTermMax(stage);
            return applyMercyGrade(raw, max);
        }
        function calcAnnualWithMercy(sid, stage) {
            const raw = [1, 2, 3].map(t => calcTotal(sid, String(t), stage)).reduce((a, b) => a + b, 0);
            const max = getTermMax(stage) * 3;
            return applyMercyGrade(raw, max);
        }

        async function storeRemove(key) { delete MEM[key]; await idbDel(key); lsDel(key); }
