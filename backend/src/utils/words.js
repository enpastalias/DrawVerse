const WORD_LIST = [
    'cat', 'dog', 'house', 'rocket', 'car', 'tree', 'sun', 'apple', 'banana', 'flower',
    'boat', 'fish', 'bird', 'hat', 'cup', 'book', 'star', 'clock', 'window', 'chair',
    'table', 'shoe', 'balloon', 'key', 'lock', 'phone', 'cloud', 'rain', 'sword', 'shield',
    'guitar', 'pencil', 'computer', 'pizza', 'hamburger', 'airplane', 'bicycle', 'butterfly'
];

export const getRandomWords = (count = 3) => {
    const shuffled = [...WORD_LIST].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
