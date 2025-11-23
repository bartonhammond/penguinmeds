const title = "Penguin Meds"

describe('Penquin Meds', () => {
    beforeAll(async () => {
	await page.goto('http://localhost:8000/')
    })

    it(`should be titled ${title}`, async () => {
	await expect(page.title()).resolves.toMatch(`${title}`)
    })
    
    it(`should have no storage initially`,async () => {
	const localStorageContent = await page.evaluate(() => {
	    return Object.assign({}, window.localStorage);
	});

	expect(Object.keys(localStorageContent).length).toBe(0);
    })

})
