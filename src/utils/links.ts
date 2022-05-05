export function testLink(link: string): boolean {
  try {
    const url = new URL(link);
    return ["http:", "https:"].includes(url.protocol);
  } catch (err) {
    return false;
  }
}
