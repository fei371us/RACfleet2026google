let counter = Math.floor(Math.random() * 9000) + 1000;

export function generateJobReference(): string {
  return `KF-${counter++}`;
}
