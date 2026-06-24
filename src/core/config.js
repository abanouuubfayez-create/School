
        // =========================================================
        // CONFIG
        // =========================================================
        const DEFAULT_STAGES = ['حضانة', 'أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي', 'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي', 'أول إعدادي', 'ثاني إعدادي', 'ثالث إعدادي', 'أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي'];
        let STAGES = [...DEFAULT_STAGES];
        const MONTHS = { 1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل', 5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس', 9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر' };
        const TERM_NAMES = { 1: 'الترم الأول', 2: 'الترم الثاني', 3: 'الترم الثالث' };
        const DB_KEY = 'school_main_db_v42';
        const CRED_KEY = 'school_credentials_v42';
        const TEACHER_CRED_KEY = 'school_teacher_credentials_v42';
        const LOGO_KEY = 'school_logo_v42';

        let DB = null;
        let LOGO_B64 = '';
        let IS_EDIT_MODE = false;
        let IS_TEACHER_MODE = false;
        let CURRENT_TEACHER = { name: '', subjects: [], stages: [] }; // بيانات المدرس الحالي
        let _excelStudentsData = null, _excelGradesData = null;

        // =========================================================
        // AUTH
        // =========================================================
        const DEFAULT_USER = 'admin';
        const DEFAULT_PASS = '1234';
        const DEFAULT_TEACHER_USER = 'teacher';
        const DEFAULT_TEACHER_PASS = '5678';

        async function getCredentials() {
            const raw = await storeLoad(CRED_KEY);
            if (raw) { try { return JSON.parse(raw); } catch (e) { } }
            return { username: DEFAULT_USER, password: DEFAULT_PASS };
        }
        async function getTeacherCredentials() {
            const raw = await storeLoad(TEACHER_CRED_KEY);
            if (raw) { try { return JSON.parse(raw); } catch (e) { } }
            return { username: DEFAULT_TEACHER_USER, password: DEFAULT_TEACHER_PASS };
