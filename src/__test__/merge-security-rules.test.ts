import mergeSecurityRules from "../merge-security-rules";


describe('Test mergeSecurityRules', () => {
  test('Test mergeSecurityRules success', () => {
    const expectedResult = 'example: merged security rules';
    const actualResult = mergeSecurityRules();

    expect(actualResult).toEqual(expectedResult);
  });
});
