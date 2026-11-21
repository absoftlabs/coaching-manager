export function getGpa(percent: number) {
    if (percent >= 80) return { grade: "A+", point: 5.0 };
    if (percent >= 70) return { grade: "A", point: 4.0 };
    if (percent >= 60) return { grade: "A-", point: 3.5 };
    if (percent >= 50) return { grade: "B", point: 3.0 };
    if (percent >= 40) return { grade: "C", point: 2.0 };
    if (percent >= 33) return { grade: "D", point: 1.0 };
    return { grade: "F", point: 0.0 };
}

export function percentOf(gain: number, total: number) {
    return total > 0 ? (gain * 100) / total : 0;
}

export function gpaLabel(gain: number, total: number) {
    const { grade, point } = getGpa(percentOf(gain, total));
    return `${grade} [${point.toFixed(2)}]`;
}
