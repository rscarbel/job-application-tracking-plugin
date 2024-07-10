document.addEventListener('DOMContentLoaded', () => {
  const codeEntrySection = document.getElementById('codeEntrySection');
  const actionSection = document.getElementById('actionSection');
  const logApplicationSection = document.getElementById(
    'logApplicationSection'
  );
  const userCodeInput = document.getElementById('userCode');
  const saveCodeButton = document.getElementById('saveCode');
  const fillApplicationButton = document.getElementById('fillApplication');
  const clearCodeButton = document.getElementById('clearCode');
  const logApplicationButton = document.getElementById('logApplication');
  const submitApplicationButton = document.getElementById('submitApplication');
  const companyNameInput = document.getElementById('companyName');
  const jobNameInput = document.getElementById('jobName');

  chrome.storage.sync.get('userCode', (result) => {
    if (result.userCode) {
      codeEntrySection.classList.add('hidden');
      actionSection.classList.remove('hidden');
    } else {
      codeEntrySection.classList.remove('hidden');
      actionSection.classList.add('hidden');
    }
  });

  saveCodeButton.addEventListener('click', async () => {
    const userCode = userCodeInput.value;
    if (userCode) {
      chrome.storage.sync.set({ userCode: userCode }, async () => {
        codeEntrySection.classList.add('hidden');
        actionSection.classList.remove('hidden');
      });
      const personalInformation = await fetchPersonalInformation(userCode);
      chrome.storage.sync.set({ personalInformation });
    } else {
      alert('Please enter a code.');
    }
  });

  fillApplicationButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting
          .executeScript({
            target: { tabId: tabs[0].id },
            func: fillJobApplicationForm,
          })
          .then(() => console.log('filled out the page'))
          .catch((error) =>
            console.error('Error filling out the page:', error)
          );
      } else {
        console.error('No active tab found.');
      }
    });
  });

  clearCodeButton.addEventListener('click', () => {
    chrome.storage.sync.remove('userCode', () => {
      alert('Code cleared successfully!');
      codeEntrySection.classList.remove('hidden');
      actionSection.classList.add('hidden');
    });
  });

  logApplicationButton.addEventListener('click', () => {
    actionSection.classList.add('hidden');
    logApplicationSection.classList.remove('hidden');
  });

  submitApplicationButton.addEventListener('click', async () => {
    const companyName = companyNameInput.value;
    const jobName = jobNameInput.value;

    if (companyName && jobName) {
      chrome.storage.sync.get('userCode', (result) => {
        const userCode = result.userCode;
        if (userCode) {
          chrome.tabs.query(
            { active: true, currentWindow: true },
            async (tabs) => {
              const tab = tabs[0];
              if (tab) {
                const applicationURL = tab.url;
                const payload = {
                  companyName,
                  jobName,
                  applicationURL,
                  userCode,
                };
                await logJobApplication(payload);
                alert('Job application logged successfully!');
                logApplicationSection.classList.add('hidden');
                actionSection.classList.remove('hidden');
              }
            }
          );
        } else {
          alert('User code not found. Please enter your code again.');
        }
      });
    } else {
      alert('Please fill in all fields.');
    }
  });
});

async function fetchPersonalInformation(userCode) {
  const url = `https://job-application-tracking-dev.vercel.app/api/plugin/getPersonalInformation?userCode=${userCode}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const personalInformation = await response.json();
      chrome.storage.sync.set({ personalInformation });
      return personalInformation;
    } else {
      console.error(
        'Failed to fetch personal information:',
        response.statusText
      );
    }
  } catch (error) {
    console.error('Error fetching personal information:', error);
  }
}

async function logJobApplication(payload) {
  const url =
    'https://job-application-tracking-dev.vercel.app/api/plugin/logApplication';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error('Failed to log job application:', response.statusText);
    }
  } catch (error) {
    console.error('Error logging job application:', error);
  }
}

function fillJobApplicationForm() {
  chrome.storage.sync.get('personalInformation', (result) => {
    if (result.personalInformation) {
      const personalInfo = result.personalInformation;
      const fieldValues = {
        addressLine1: personalInfo.streetAddress1 || '',
        addressLine2: personalInfo.streetAddress2 || '',
        addressLine3: personalInfo.streetAddress3 || '',
        authorizedToWork: personalInfo.authorizedForWorkInUnitedStates || 'no',
        city: personalInfo.city || '',
        country: personalInfo.country || '',
        county: personalInfo.county || '',
        currentCompany: personalInfo.currentCompany || '',
        currentLocation: `${personalInfo.city || ''}, ${
          personalInfo.state || ''
        }`,
        currentTitle: personalInfo.currentTitle || '',
        email: personalInfo.email || '',
        expectedSalary: '',
        firstName: personalInfo.firstName || '',
        hasBachelorDegree: personalInfo.hasBachelorDegree || 'no',
        lastName: personalInfo.lastName || '',
        linkedin: personalInfo.linkedIn || '',
        middleName: personalInfo.middleName || '',
        name: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`,
        phone: personalInfo.phone || '',
        phoneCountryCode: personalInfo.phoneCountryCode || '',
        requireSponsorship: personalInfo.requiresVisaSponsorship || 'no',
        state: personalInfo.state || '',
        title: personalInfo.title || '',
        zip: personalInfo.postalCode || '',
      };

      const allDivs = document.querySelectorAll('div');
      const allLabels = document.querySelectorAll('label');
      const allInputs = document.querySelectorAll('input, textarea, select');

      const fieldNames = {
        addressLine1: [
          'address line 1',
          'address1',
          'street address 1',
          'address',
          'street address',
          'street',
          'address line',
          'addr line 1',
          'addr1',
          'street 1',
          'addr line one',
          'address line one',
          'line 1 address',
          'address line first',
          'primary address line',
          'address primary',
          'address first',
        ],
        addressLine2: [
          'address line 2',
          'address2',
          'street address 2',
          'addr line 2',
          'addr2',
          'street 2',
          'addr line two',
          'address line two',
          'line 2 address',
          'secondary address line',
          'address secondary',
          'address second',
          'address supplemental',
          'additional address',
          'address additional',
        ],
        addressLine3: [
          'address line 3',
          'address3',
          'street address 3',
          'addr line 3',
          'addr3',
          'street 3',
          'addr line three',
          'address line three',
          'line 3 address',
          'tertiary address line',
          'address tertiary',
          'address third',
          'address extra',
          'additional address 3',
          'extra address',
        ],
        authorizedToWork: [
          'authorized to work',
          'work authorization',
          'work permit',
          'authorized for employment',
          'eligible to work',
          'employment eligibility',
          'right to work',
          'work visa status',
          'work authorization status',
          'authorized for job',
          'work eligibility',
        ],
        city: [
          'city',
          'town',
          'municipality',
          'locality',
          'city name',
          'town name',
          'place',
          'urban area',
          'metropolis',
          'borough',
          'city/town',
          'village',
        ],
        country: [
          'country',
          'nation',
          'country name',
          'nation name',
          'state',
          'country of residence',
          'residence country',
          'country of origin',
          'home country',
          'country living in',
          'country code',
        ],
        county: [
          'county',
          'parish',
          'district',
          'region',
          'subdivision',
          'administrative region',
          'county name',
          'borough',
          'county/region',
          'county/district',
          'area',
          'zone',
          'territory',
        ],
        currentCompany: [
          'current company',
          'employer',
          'current employer',
          'present company',
          'company name',
          'organization',
          'organization name',
          'firm',
          'workplace',
          'current workplace',
          'corporation',
          'company of employment',
          'current firm',
          'current org',
          'current organization',
          'present employer',
        ],
        currentLocation: [
          'current location',
          'location',
          'full address',
          'full_address',
          'complete address',
          'place of residence',
          'current address',
          'present address',
          'residential address',
          'address now',
          'current city',
          'current town',
          'where living now',
          'address currently',
        ],
        currentTitle: [
          'current title',
          'job title',
          'position',
          'current position',
          'job role',
          'role',
          'position title',
          'employment title',
          'designation',
          'title at work',
          'current job title',
          'work title',
        ],
        email: [
          'email',
          'e-mail',
          'confirm_email',
          'email address',
          'email_address',
          'email id',
          'mail',
          'e-mail address',
          'contact email',
          'email id',
          'emailid',
          'primary email',
          'secondary email',
          'personal email',
          'work email',
        ],
        expectedSalary: [
          'expected salary',
          'salary expectation',
          'desired salary',
          'salary desired',
          'expected compensation',
          'compensation expectation',
          'desired compensation',
          'salary requirement',
          'salary expected',
          'desired pay',
          'pay expectation',
          'compensation required',
        ],
        firstName: [
          'first name',
          'firstname',
          'first_name',
          'given name',
          'forename',
          'first',
          'first name:',
          'fname',
          'initial name',
          'first given name',
          'primary name',
          'legal first name',
          'first legal name',
        ],
        hasBachelorDegree: [
          'bachelor',
          "bachelor's degree",
          'undergraduate degree',
          'bachelors',
          'bachelor degree',
          'BA',
          'BS',
          'b.sc',
          'bachelor of arts',
          'bachelor of science',
          'college degree',
          'university degree',
          'undergrad degree',
        ],
        lastName: [
          'last name',
          'lastname',
          'last_name',
          'surname',
          'family name',
          'last',
          'surname:',
          'last name:',
          'lname',
          'second name',
          'final name',
          'legal last name',
          'legal surname',
        ],
        linkedin: [
          'linkedin',
          'linkedin profile',
          'linkedin url',
          'linkedin link',
          'linkedin account',
          'profile link',
          'linkedin profile link',
          'linkedin address',
          'linkedin profile address',
        ],
        middleName: [
          'middle name',
          'middlename',
          'middle_name',
          'middle',
          'mid name',
          'middle initial',
          'middle name:',
          'middle given name',
          'secondary name',
        ],
        name: [
          'full name',
          'full name:',
          'full_name',
          'complete name',
          'name',
          'full',
          'full legal name',
          'name complete',
          'entire name',
          'name full',
        ],
        phone: [
          'phone',
          'phone number',
          'telephone',
          'mobile',
          'cellphone',
          'phone number:',
          'contact number',
          'contact phone',
          'mobile number',
          'telephone number',
          'cell number',
          'cell',
          'mobile phone',
          'phone:',
          'contact:',
          'phone no',
          'phone #',
          'tel',
        ],
        phoneCountryCode: [
          'phone country code',
          'country code',
          'phone code',
          'dialing code',
          'phone international code',
          'intl code',
          'phone country prefix',
          'country prefix',
          'country dial code',
          'dial code',
        ],
        requireSponsorship: [
          'require sponsorship',
          'sponsorship',
          'need sponsorship',
          'require work sponsorship',
          'sponsorship required',
          'work visa sponsorship',
          'work authorization sponsorship',
          'job sponsorship',
          'employment sponsorship',
        ],
        state: [
          'state',
          'province',
          'region',
          'state/province',
          'state/region',
          'state or province',
          'territory',
          'state name',
          'province name',
          'state:',
          'province:',
          'state/territory',
          'state/county',
        ],
        title: [
          'title',
          'salutation',
          'prefix',
          'honorific',
          'title:',
          'name title',
          'professional title',
          'courtesy title',
          'form of address',
          'title of respect',
        ],
        zip: [
          'zip',
          'zipcode',
          'postal code',
          'zip code',
          'zip/postal code',
          'postal/zip code',
          'zip:',
          'postal:',
          'postcode',
          'post code',
          'zip code:',
          'postal code:',
          'zip/postcode',
          'zip/postal',
          'zip code/zip',
        ],
      };

      const fieldsToSearch = [
        'name',
        'middleName',
        'firstName',
        'lastName',
        'title',
        'email',
        'phone',
        'phoneCountryCode',
        'addressLine1',
        'addressLine2',
        'addressLine3',
        'county',
        'city',
        'state',
        'zip',
        'country',
        'linkedin',
        'authorizedToWork',
        'requireSponsorship',
        'hasBachelorDegree',
        'currentCompany',
        'currentTitle',
        'currentLocation',
        'expectedSalary',
      ];

      const fillInputByLabel = (labelText, value) => {
        try {
          allLabels.forEach((label) => {
            const formText = label.textContent.trim().toLowerCase();
            labelText.forEach((text) => {
              if (formText.includes(text.toLowerCase())) {
                const inputId = label.getAttribute('for');
                const input = document.getElementById(inputId);
                if (input) {
                  if (input.tagName.toLowerCase() === 'select') {
                    Array.from(input.options).forEach((option) => {
                      if (option.text.toLowerCase() === value.toLowerCase()) {
                        input.value = option.value;
                      }
                    });
                  } else if (input.type === 'radio') {
                    const radio = document.querySelector(
                      `input[name="${
                        input.name
                      }"][value="${value.toLowerCase()}"]`
                    );
                    if (radio) {
                      radio.checked = true;
                    }
                  } else {
                    input.value = value;
                  }
                } else {
                  const radios =
                    label.parentElement.querySelectorAll(`input[type="radio"]`);
                  radios.forEach((radio) => {
                    if (radio.value.toLowerCase() === value.toLowerCase()) {
                      radio.checked = true;
                    }
                  });
                }
              }
            });
          });
        } catch (error) {
          console.error('Error in fillInputByLabel:', error);
        }
      };

      const fillInputByDiv = (divText, value) => {
        try {
          allDivs.forEach((div) => {
            const divContent = div.textContent.trim().toLowerCase();
            divText.forEach((text) => {
              if (divContent.includes(text.toLowerCase())) {
                if (div.nextElementSibling) {
                  const input = div.nextElementSibling.querySelector(
                    'input, textarea, select'
                  );
                  if (input) {
                    if (input.tagName.toLowerCase() === 'select') {
                      Array.from(input.options).forEach((option) => {
                        if (option.text.toLowerCase() === value.toLowerCase()) {
                          input.value = option.value;
                        }
                      });
                    } else if (input.type === 'radio') {
                      const radio = document.querySelector(
                        `input[name="${
                          input.name
                        }"][value="${value.toLowerCase()}"]`
                      );
                      if (radio) {
                        radio.checked = true;
                      }
                    } else {
                      input.value = value;
                    }
                  }
                } else {
                  const radios =
                    div.parentElement.querySelectorAll(`input[type="radio"]`);
                  radios.forEach((radio) => {
                    if (radio.value.toLowerCase() === value.toLowerCase()) {
                      radio.checked = true;
                    }
                  });
                }
              }
            });
          });
        } catch (error) {
          console.error('Error in fillInputByDiv:', error);
        }
      };

      const fillInputByPlaceholder = (placeholderText, value) => {
        try {
          allInputs.forEach((input) => {
            const placeholder = input
              .getAttribute('placeholder')
              ?.trim()
              .toLowerCase();
            placeholderText.forEach((text) => {
              if (placeholder && placeholder.includes(text.toLowerCase())) {
                if (input.tagName.toLowerCase() === 'select') {
                  Array.from(input.options).forEach((option) => {
                    if (option.text.toLowerCase() === value.toLowerCase()) {
                      input.value = option.value;
                    }
                  });
                } else if (input.type === 'radio') {
                  const radio = document.querySelector(
                    `input[name="${
                      input.name
                    }"][value="${value.toLowerCase()}"]`
                  );
                  if (radio) {
                    radio.checked = true;
                  }
                } else {
                  input.value = value;
                }
              }
            });
          });
        } catch (error) {
          console.error('Error in fillInputByPlaceholder:', error);
        }
      };

      const fillInputByName = (nameText, value) => {
        try {
          allInputs.forEach((input) => {
            const nameAttr = input.getAttribute('name')?.trim().toLowerCase();
            nameText.forEach((text) => {
              if (nameAttr && nameAttr.includes(text.toLowerCase())) {
                if (input.tagName.toLowerCase() === 'select') {
                  Array.from(input.options).forEach((option) => {
                    if (option.text.toLowerCase() === value.toLowerCase()) {
                      input.value = option.value;
                    }
                  });
                } else if (input.type === 'radio') {
                  const radio = document.querySelector(
                    `input[name="${
                      input.name
                    }"][value="${value.toLowerCase()}"]`
                  );
                  if (radio) {
                    radio.checked = true;
                  }
                } else {
                  input.value = value;
                }
              }
            });
          });
        } catch (error) {
          console.error('Error in fillInputByName:', error);
        }
      };

      const fillInputById = (idText, value) => {
        try {
          allInputs.forEach((input) => {
            const idAttr = input.getAttribute('id')?.trim().toLowerCase();
            idText.forEach((text) => {
              if (idAttr && idAttr.includes(text.toLowerCase())) {
                if (input.tagName.toLowerCase() === 'select') {
                  Array.from(input.options).forEach((option) => {
                    if (option.text.toLowerCase() === value.toLowerCase()) {
                      input.value = option.value;
                    }
                  });
                } else if (input.type === 'radio') {
                  const radio = document.querySelector(
                    `input[name="${
                      input.name
                    }"][value="${value.toLowerCase()}"]`
                  );
                  if (radio) {
                    radio.checked = true;
                  }
                } else {
                  input.value = value;
                }
              }
            });
          });
        } catch (error) {
          console.error('Error in fillInputById:', error);
        }
      };

      const fillInput = (labelTextArray, value) => {
        fillInputByLabel(labelTextArray, value);
        fillInputByDiv(labelTextArray, value);
        fillInputByPlaceholder(labelTextArray, value);
        fillInputByName(labelTextArray, value);
        fillInputById(labelTextArray, value);
      };

      fieldsToSearch.forEach((key) => {
        fillInput(fieldNames[key], fieldValues[key]);
      });

      allInputs.forEach((input) => {
        try {
          if (input.type === 'email') {
            input.value = fieldValues.email;
          }
          if (input.type === 'tel') {
            input.value = fieldValues.phone;
          }
        } catch (error) {
          console.error('Error in final input assignment:', error);
        }
      });
    } else {
      console.error('No personal information found in storage');
    }
  });
}
