export function formatDate(date: Date) {
    const month = date.getMonth() + 1;
    const monthString = month.toString().padStart(2, '0');
    const day = date.getDate();
    const dayString = day.toString().padStart(2, '0');
    return `${date.getFullYear()}-${monthString}-${dayString}`;
}
