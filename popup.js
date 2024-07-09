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
        firstName: personalInfo.firstName || '',
        lastName: personalInfo.lastName || '',
        name: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`,
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        address: personalInfo.streetAddress1 || '',
        city: personalInfo.city || '',
        state: personalInfo.state || '',
        zip: personalInfo.postalCode || '',
        country: personalInfo.country || '',
        linkedin: personalInfo.linkedIn || '',
        authorizedToWork: personalInfo.authorizedForWorkInUnitedStates || 'no',
        requireSponsorship: personalInfo.requiresVisaSponsorship || 'no',
        hasBachelorDegree: personalInfo.hasBachelorDegree || 'no',
        currentCompany: personalInfo.currentCompany || '',
        currentTitle: personalInfo.currentTitle || '',
        currentLocation: `${personalInfo.city || ''}, ${
          personalInfo.state || ''
        }`,
        expectedSalary: '',
      };

      const allDivs = document.querySelectorAll('div');
      const allLabels = document.querySelectorAll('label');
      const allInputs = document.querySelectorAll('input');

      const fieldNames = {
        name: ['name', 'full name', 'full name:', 'full_name', 'complete name'],
        firstName: ['first name', 'firstname', 'first_name', 'given name'],
        lastName: [
          'last name',
          'lastname',
          'last_name',
          'surname',
          'family name',
        ],
        email: [
          'email',
          'e-mail',
          'confirm_email',
          'email address',
          'email_address',
        ],
        phone: ['phone', 'phone number', 'telephone', 'mobile'],
        address: ['address', 'street address', 'street', 'address line'],
        city: ['city', 'town'],
        state: ['state', 'province', 'region'],
        zip: ['zip', 'zipcode', 'postal code'],
        country: ['country', 'nation'],
        linkedin: ['linkedin', 'linkedin profile'],
        authorizedToWork: ['authorized to work', 'work authorization'],
        requireSponsorship: ['require sponsorship', 'sponsorship'],
        hasBachelorDegree: [
          'bachelor',
          "bachelor's degree",
          'undergraduate degree',
        ],
        currentCompany: ['current company', 'employer'],
        currentTitle: ['current title', 'job title', 'position'],
        currentLocation: [
          'current location',
          'location',
          'full address',
          'full_address',
          'complete address',
          'place of residence',
        ],
        expectedSalary: [
          'expected salary',
          'salary expectation',
          'desired salary',
        ],
      };

      const fieldsToSearch = [
        'name',
        'firstName',
        'lastName',
        'email',
        'phone',
        'address',
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
                  input.value = value;
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
                const input = div.nextElementSibling.querySelector(
                  'input, textarea, select'
                );
                if (input) {
                  input.value = value;
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
                input.value = value;
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
                input.value = value;
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
                input.value = value;
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
        fillInput(fieldNames[key], value);
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
