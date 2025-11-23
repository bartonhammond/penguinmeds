const title = "Penguin Meds"

describe('Penquin Meds', () => {
    beforeAll(async () => {
	await page.goto('http://localhost:8000/')
	page.on('console', consoleObj => console.log(consoleObj.text()));
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

    it(`should have 5 tabs`, async() => {
	const numButtons  = await page.$$eval('.tabs button', (buttons) => {
	    return buttons.length
	    /*
	    let str = buttons.map(button  => button.textContent)
	    return str
	    */
	})
	expect(numButtons).toBe(5); 
    })

})
