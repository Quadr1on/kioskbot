// Top ~700 common English words for autocorrect + hospital terms
// This gives real, useful autocorrect like Gboard

export const DICTIONARY: string[] = [
    // Common English (top 500)
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
    'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
    'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
    'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
    'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
    'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
    'because', 'any', 'these', 'give', 'day', 'most', 'us', 'great', 'between', 'need', 'large',
    'under', 'never', 'same', 'last', 'long', 'much', 'right', 'where', 'after', 'thing', 'still',
    'many', 'here', 'should', 'ask', 'found', 'home', 'hand', 'high', 'place', 'small', 'big',
    'keep', 'help', 'every', 'start', 'show', 'each', 'side', 'both', 'must', 'own', 'end', 'does',
    'point', 'city', 'read', 'change', 'close', 'night', 'real', 'life', 'few', 'stop', 'open',
    'seem', 'together', 'next', 'white', 'began', 'face', 'fact', 'unit', 'children', 'case',
    'walk', 'line', 'name', 'play', 'world', 'away', 'move', 'live', 'school', 'turn', 'head',
    'family', 'state', 'leave', 'while', 'number', 'never', 'begin', 'might', 'part', 'old',
    'miss', 'idea', 'enough', 'eat', 'watch', 'far', 'let', 'thought', 'word', 'keep', 'again',
    'went', 'important', 'run', 'kind', 'young', 'often', 'until', 'body', 'hard', 'set', 'got',
    'put', 'left', 'hear', 'feel', 'really', 'old', 'best', 'tell', 'try', 'call', 'sure', 'wait',
    'something', 'anything', 'everything', 'nothing', 'everyone', 'someone', 'always', 'never',
    'yes', 'no', 'okay', 'please', 'thank', 'thanks', 'sorry', 'hello', 'hi', 'bye', 'goodbye',
    'morning', 'afternoon', 'evening', 'night', 'today', 'tomorrow', 'yesterday', 'week', 'month',
    'before', 'after', 'above', 'below', 'between', 'during', 'without', 'along', 'around',
    'another', 'such', 'very', 'much', 'more', 'less', 'better', 'worse', 'best', 'worst',
    'happy', 'sad', 'good', 'bad', 'nice', 'fine', 'great', 'wonderful', 'terrible', 'beautiful',
    'love', 'hate', 'want', 'need', 'hope', 'wish', 'believe', 'understand', 'remember', 'forget',
    'bring', 'buy', 'catch', 'choose', 'cost', 'cut', 'draw', 'drink', 'drive', 'eat', 'fall',
    'feed', 'fight', 'find', 'fly', 'get', 'give', 'grow', 'hang', 'hear', 'hide', 'hit', 'hold',
    'hurt', 'keep', 'know', 'lead', 'learn', 'leave', 'lend', 'let', 'lie', 'light', 'lose', 'make',
    'mean', 'meet', 'move', 'must', 'pay', 'put', 'read', 'ride', 'ring', 'rise', 'run', 'say',
    'see', 'sell', 'send', 'show', 'shut', 'sing', 'sit', 'sleep', 'speak', 'spend', 'stand',
    'steal', 'swim', 'take', 'teach', 'tell', 'think', 'throw', 'understand', 'wake', 'wear',
    'win', 'write', 'able', 'available', 'possible', 'different', 'important', 'interesting',
    'water', 'food', 'money', 'house', 'car', 'door', 'room', 'table', 'window', 'chair',
    'phone', 'book', 'paper', 'letter', 'picture', 'question', 'answer', 'problem', 'reason',
    'country', 'city', 'street', 'market', 'office', 'job', 'business', 'company', 'service',
    'number', 'group', 'system', 'program', 'result', 'information', 'process', 'level',
    // Hospital & Medical
    'appointment', 'doctor', 'hospital', 'department', 'cardiology', 'neurology',
    'orthopedics', 'patient', 'emergency', 'ambulance', 'visiting', 'hours',
    'medicine', 'general', 'pediatrics', 'gynecology', 'dermatology',
    'ophthalmology', 'gastroenterology', 'surgery', 'pharmacy', 'reception',
    'consultation', 'prescription', 'scan', 'xray', 'blood', 'test', 'report',
    'billing', 'insurance', 'discharge', 'admission', 'urology', 'oncology',
    'radiology', 'pathology', 'pulmonology', 'physiotherapy', 'dialysis',
    'laboratory', 'injection', 'nurse', 'ward', 'bed', 'operation', 'therapy',
    'diagnosis', 'symptom', 'treatment', 'checkup', 'health', 'medical', 'clinic',
    'specialist', 'surgeon', 'anesthesia', 'intensive', 'care', 'outpatient',
    'inpatient', 'referral', 'follow', 'fever', 'pain', 'cough', 'headache',
    'allergy', 'infection', 'fracture', 'pregnancy', 'dental', 'eye', 'ear',
    'nose', 'throat', 'heart', 'lung', 'kidney', 'liver', 'bone', 'skin',
    'brain', 'stomach', 'chest', 'back', 'shoulder', 'knee', 'ankle', 'wrist',
];

// Remove duplicates
const seen = new Set<string>();
export const WORD_LIST: string[] = DICTIONARY.filter(w => {
    if (seen.has(w)) return false;
    seen.add(w);
    return true;
});
