
import puppeteer from 'puppeteer';
import Tesseract from 'tesseract.js';
import chromium from '@sparticuz/chromium-min'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs';
import path from 'path';


let browser;
let page;
let finalList = [];
let supabase;
//  const allGrowers = ['213'];
//  const allVillages= ['447'];
//  const allFactories= ['300']; 
const allGrowers = ['144', '7', '193', '195', '324', '329', '328', '217', '222', '219', '206', '202', '218', '902', '394', '503', '171', '20230',
  '993', '175', '191', '584', '583', '582', '585', '23', '225', '500', '13', '9', '31649', '220', '145', '140', '201', '194', '416', '415',
  '414', '164', '200', '468', '31303', '31302', '85566', '31634', '1138', '1137', '466', '673', '352', '325', '676', '477', '476', '325',
  '326', '8718', '8720', '1', '2', '19559', '3', '31700', '8789', '8794', '13', '452', '383', '1026', '341', '213', '715', '347', '4',
  '183', '237', '494', '502', '497', '723', '716', '715', '342', '343', '590', '85', '1534', '93', '304', '389', '390', '391', '392', '393'
  , '5', '1696', '2', '214', '216', '860', '302', '632', '633', '634', '635', '636', '1025', '1026', '741', '275', '214']


const allVillages = ['235', '235', '447', '447', '124', '124', '124', '2252', '2252', '2252', '2252', '2252', '2252', '228', '252',
  '231', '225', '230', '203', '235', '225', '233', '233', '233', '233', '231', '231', '231', '229', '229', '410', '2252', '271', '271',
  '237', '237', '237', '237', '237', '237', '237', '237', '410', '410', '301', '410', '302', '302', '237', '233', '2252', '276', '233',
  '237', '237', '2252', '2252', '412', '412', '215', '253', '404', '410', '410', '412', '412', '262', '246', '205', '215', '276', '447',
  '233', '205', '205', '447', '235', '237', '237', '237', '233', '233', '233', '276', '276', '231', '260', '302', '482', '230', '2252',
  '2252', '2252', '2252', '2252', '252', '302', '276', '447', '447', '266', '230', '316', '316', '316', '316', '316', '215', '215', '370',
  '357', '357']

const allFactories = ['300', '300', '300', '300', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6',
  '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '300', '300', '6', '6', '6', '6', '6',
  '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '300', '300', '300', '300', '6', '300', '6', '300', '300', '300', '6', '6',
  '6', '6', '6', '6', '6', '6', '6', '6', '300', '300', '300', '6', '6', '6', '6', '6', '6', '6', '300', '6', '300', '300', '300', '6', '300',
  '300', '300', '300', '300', '300', '300', '300', '300', '300']

const BondRunners = ['VA', 'VA', 'VA', 'VA', 'AS', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA',
  'VA', 'AS', 'AS', 'AS', 'VA', 'VA', 'VA', 'VA', 'AS', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA',
  'VA', 'VA', 'VA', 'AS', 'VA', 'VA', 'VA', 'AS', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'AS', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA',
  'AS', 'VA', 'VA', 'VA', 'VA', 'VA', 'AS', 'AS', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA', 'VA',
  'VA', 'VA', 'VA', 'VA', 'VA', 'AS', 'AS', 'AS', 'AS', 'AS', 'VA', 'VA', 'GM', 'GM', 'AS', 'VA', 'AS', 'VA', 'VA', 'AS', 'AS', 'VA']
// Initialize Puppeteer browser if not already open
async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      headless: false,

    });
    page = (await browser.pages())[0];
  }
}

// Capture and save the captcha image
async function captureCaptchaImage(url, selector) {
  await page.goto(url, { waitUntil: 'load' });

  const elementHandler = await page.$(selector);
  if (elementHandler) {
    const boundingBox = await elementHandler.boundingBox();
    await page.reload();

    const image = await page.screenshot({
      clip: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      },
    });

    const tmpFilePath = path.resolve('captcha.jpg');
    fs.writeFileSync(tmpFilePath, image);
    console.log("captured Image");
    return image;
  } else {
    throw new Error('Element not found');
  }
}

// Recognize text from saved captcha image
async function recognizeCaptcha() {
  const imagePath = path.resolve('captcha.jpg');
  try {
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng',
      { logger: (m) => console.log(m) }
    );
    return text.replace(/\s+/g, '');
  } catch (error) {
    throw new Error('Failed to recognize text from captcha');
  }
}




// Retrieve data based on form inputs
async function retrieveData(allVillages, allFactories, allGrowers, BondRunners) {
  let currentDate =formatCurrentDate();
  console.log("currentDate is",currentDate.toString());
  currentDate= currentDate.toString();
  try {
    await page.select('#DdlDistrict', '21');
  } catch (e) {
    return "errord";
  }
  await page.waitForSelector('#DdlFactory');
  //await page.select('#DdlFactory', allFactories[j]);
  await sleep(600);
  await page.waitForSelector('#ChkCode');
  await page.click('#ChkCode');
  await page.waitForSelector('#ChkCode:checked');
  await sleep(600);
  for (let j = 0; j < allVillages.length; j++) {
    try {
      console.log(`Selecting factory: ${allFactories[j]} for village: ${allVillages[j]} and grower: ${allGrowers[j]}`);

      await page.select('#DdlFactory', allFactories[j]);

      await page.waitForFunction(() => {
        const factoryDropdown = document.querySelector('#DdlFactory');
        return factoryDropdown && factoryDropdown.options.length > 1;
      });

      await sleep(600);

      await page.waitForSelector('#TxtVillage');
      await page.$eval('#TxtVillage', input => (input.value = ''));
      await page.type('#TxtVillage', allVillages[j]);
      console.log("added village code");
      // console.log("adding grower code");
      await page.waitForSelector('#TxtGrower');
      await page.$eval('#TxtGrower', input => (input.value = ''));
      await page.type('#TxtGrower', allGrowers[j]);
      // console.log("added");
      await page.waitForSelector('#BtnCodeView');
      await page.click('#BtnCodeView');
      await handleAlertOnce(page);

      await page.waitForSelector('#LblGrowerName');

      // console.log("grower name utha raha hai");
      const societyNameOnGUI = await page.$eval('#LblSociety', element => element.textContent.trim());
      const factoryNameOnGUI = await page.$eval('#LblFact', element => element.textContent.trim());
      const villageName = await page.$eval('#LblVillage', element => element.textContent.trim());
      const growerName = await page.$eval('#LblGrowerName', element => element.textContent.trim());
      const fatherName = await page.$eval('#LblFatherName', element => element.textContent.trim());
      const runner = BondRunners[j];
      // console.log(" utha liya");
      await page.click('#__tab_tcMasterInfo_tplSupply');
      await sleep(600);
      //  console.log(" ticket tab aagye");


      const rawData = await page.evaluate((fatherName, growerName, villageName, runner, currentDate) => {
        let data = [];
       
        let table = document.getElementById('tcMasterInfo_tplSupply_grdSupply');
        // console.log(" table access kiya");

        if (table && table.rows.length >= 1) {
          for (let i = 1; i < table.rows.length; i++) {
            let objCells = table.rows.item(i).cells;
            //console.log("till here");
            if ( objCells.item(4).innerText.trim() === currentDate) {
              let values = {
                ticketNo: objCells.item(0)?.innerText.trim() || '',
                prajati: objCells.item(1)?.innerText.trim() || '',
                dasha: objCells.item(2)?.innerText.trim() || '',
                isWeighed: objCells.item(3)?.innerText.trim() || '',
                datePublished: objCells.item(4)?.innerText.trim() || '',
                expiryDate: objCells.item(5)?.innerText.trim() || '',
                class: objCells.item(6)?.innerText.trim() || '',
                medium: objCells.item(7)?.innerText.trim() || '',
                name: growerName,
                fatherName: fatherName,
                villageName: villageName,
                BondRunner: runner,
              };

              let entry = { values };




              if (
                values['datePublished'] === currentDate) {

            
                
                data.push(entry);
              }


            }
          }
        }
        return { name: growerName, entries: data, };
      }, fatherName, growerName, villageName, runner,currentDate);

      if (rawData.entries.length > 0) {
        console.log(rawData);

        // Assuming you're using Supabase client here, perform the insert outside page.evaluate()
        for (let entry of rawData.entries) {
          const { data, error } = await supabase
            .from('Ticket')
            .insert([
              { Ticket_Number: entry.values.ticketNo, Name:entry.values.name,
                FatherName:entry.values.fatherName,VillageName:entry.values.villageName,
                datePublished:entry.values.datePublished,expiryDate:entry.values.expiryDate },
            ])
            .select();

          if (error) {
            console.error('Supabase insert error: ', error);
          } else {
            console.log('Inserted ticket:', data);
          }
        }

        finalList.push(rawData);
      }

    } catch (error) {
      console.error('Error processing village: ', allVillages[j], allGrowers[j], j, error);
      continue;
    }
  }
  return finalList;
}


async function validateCaptcha(userResponse) {

  await page.type('#txtCaptcha', userResponse);
  await sleep(1800);
  await page.click('#BtnLogin');
  console.log(" sab sahi");
  return true; // Placeholder logic, update accordingly
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export async function handleAlertOnce(page) {
  return new Promise(resolve => {
    page.once('dialog', async (dialog) => {
      // console.log(dialog.type());
      // console.log(dialog.message());
      await dialog.accept();
      resolve(); // Resolve the promise after handling the alert
    });
  });
}

function formatCurrentDate() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Get the current date and time in UTC
  const now = new Date();

  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(now.getTime() - istOffset);

  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const month = months[istTime.getUTCMonth()];
  const year = istTime.getUTCFullYear();

  return `${day}-${month}-${year}`;
}





// Lambda-compatible handler function
(async () => {
  try {
    console.log('Factory length:', allFactories.length, 'Grower length:', allGrowers.length);
    const supabaseUrl = 'https://sbowguaccgobcghxcqht.supabase.co'
      const supabaseKey='myKey'
    supabase = createClient(supabaseUrl, supabaseKey)
    // Initialize the browser
    await initBrowser();
    console.log("Browser launched");

    // Capture captcha image
    await captureCaptchaImage("https://enquiry.caneup.in/", "#imgCaptcha");

    // Recognize captcha text
    const captchaText = await recognizeCaptcha();
    console.log("Captcha text:", captchaText);


    await validateCaptcha(captchaText);


    await sleep(600);


    // Retrieve data using the given parameters
    let data = await retrieveData(allVillages, allFactories, allGrowers, BondRunners);

    while (data === "errord") {
      await initBrowser();
      console.log("Browser launched");
      await captureCaptchaImage("https://enquiry.caneup.in/", "#imgCaptcha");
      const captchaText = await recognizeCaptcha();
      console.log("Captcha text:", captchaText);
      await validateCaptcha(captchaText);
      await sleep(600);
      data = await retrieveData(allVillages, allFactories, allGrowers, BondRunners);
    }
    // Print the final results
    console.log("Final Data:", JSON.stringify({ captcha: captchaText, tickets: data }, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    // Close the browser to avoid resource leaks
    if (browser) {
      await browser.close();
      console.log("Browser closed");
    }
  }
})();




