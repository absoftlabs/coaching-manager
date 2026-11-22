/** Grading scale, highest first. `range` is the label shown on printed sheets. */
export const GRADE_SCALE = [
    { min: 80, range: "80 - 100", grade: "A+", point: 5.0 },
    { min: 70, range: "70 - 79", grade: "A", point: 4.0 },
    { min: 60, range: "60 - 69", grade: "A-", point: 3.5 },
    { min: 50, range: "50 - 59", grade: "B", point: 3.0 },
    { min: 40, range: "40 - 49", grade: "C", point: 2.0 },
    { min: 33, range: "33 - 39", grade: "D", point: 1.0 },
    { min: 0, range: "0 - 32", grade: "F", point: 0.0 },
] as const;

export function getGpa(percent: number) {
    const g = GRADE_SCALE.find((s) => percent >= s.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
    return { grade: g.grade as string, point: g.point as number };
}

export function percentOf(gain: number, total: number) {
    return total > 0 ? (gain * 100) / total : 0;
}

export function gpaLabel(gain: number, total: number) {
    const { grade, point } = getGpa(percentOf(gain, total));
    return `${grade} [${point.toFixed(2)}]`;
}
