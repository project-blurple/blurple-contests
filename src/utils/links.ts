// eslint-disable-next-line import/prefer-default-export -- multiple exports can be defined in this file
export function testLink(link: string): boolean {
  try {
    const url = new URL(link);
    return ["http:", "https:"].includes(url.protocol);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return false;
  }
}
