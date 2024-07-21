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
  const cityInput = document.getElementById('city');
  const stateInput = document.getElementById('state');
  const workModeInput = document.getElementById('workMode');
  const payAmountInput = document.getElementById('payAmount');
  const showExtraFieldsButton = document.getElementById('showMoreFields');
  const extraFields = document.getElementById('extraFields');
  const payErrorMessage = document.getElementById('pay-error-message');
  const closeButton = document.getElementById('closeButton');
  const notesInput = document.getElementById('notes');
  const evenMoreHiddenFields = document.getElementById(
    'even-more-extra-fields'
  );
  const showEvenMoreFieldsButton =
    document.getElementById('showEvenMoreFields');
  const salaryRangeMaxInput = document.getElementById('salaryRangeMax');
  const salaryRangeMinInput = document.getElementById('salaryRangeMin');
  const workTypeInput = document.getElementById('workType');
  const industryInput = document.getElementById('industry');
  const companySizeInput = document.getElementById('companySize');
  const companyTypeInput = document.getElementById('companyType');
  const companyDesirabilityInput = document.getElementById(
    'companyDesireability'
  );
  const companyWebsiteInput = document.getElementById('companyWebsite');
  const companyLinkedinInput = document.getElementById('companyLinkedin');
  const streetAddressInput = document.getElementById('streetAddress');
  const streetAddress2Input = document.getElementById('streetAddress2');
  const postalCodeInput = document.getElementById('postalCode');
  const countryInput = document.getElementById('country');
  const jobDescriptionInput = document.getElementById('jobDescription');
  const payFrequencyInput = document.getElementById('payFrequency');

  function resizePopup() {
    const container = document.querySelector('.container');
    document.body.style.height = container.scrollHeight + 'px';
    window.resizeTo(document.body.scrollWidth, document.body.scrollHeight);
  }

  closeButton.addEventListener('click', () => {
    window.close();
  });

  chrome.storage.sync.get('userCode', (result) => {
    if (result.userCode) {
      codeEntrySection.classList.add('hidden');
      actionSection.classList.remove('hidden');
    } else {
      codeEntrySection.classList.remove('hidden');
      actionSection.classList.add('hidden');
    }
    resizePopup();
  });

  payAmountInput.addEventListener('input', validateForm);
  companyNameInput.addEventListener('input', validateForm);
  jobNameInput.addEventListener('input', validateForm);

  showExtraFieldsButton.addEventListener('click', () => {
    if (extraFields.classList.contains('hidden')) {
      extraFields.classList.remove('hidden');
      showExtraFieldsButton.innerHTML =
        '<i class="fas fa-minus"></i> Hide extra fields';
      showEvenMoreFieldsButton.classList.remove('hidden');
    } else {
      extraFields.classList.add('hidden');
      showExtraFieldsButton.innerHTML =
        '<i class="fas fa-plus"></i> Show more fields';
      showEvenMoreFieldsButton.classList.add('hidden');
      if (!evenMoreHiddenFields.classList.contains('hidden')) {
        evenMoreHiddenFields.classList.add('hidden');
      }
      [
        cityInput,
        stateInput,
        workModeInput,
        payAmountInput,
        notesInput,
        salaryRangeMaxInput,
        salaryRangeMinInput,
        workTypeInput,
        industryInput,
        companySizeInput,
        companyTypeInput,
        companyDesirabilityInput,
        companyWebsiteInput,
        companyLinkedinInput,
        streetAddressInput,
        streetAddress2Input,
        postalCodeInput,
        countryInput,
        jobDescriptionInput,
        payFrequencyInput,
      ].forEach((input) => {
        input.value = '';
      });
    }
    resizePopup();
  });

  showEvenMoreFieldsButton.addEventListener('click', () => {
    evenMoreHiddenFields.classList.remove('hidden');
    showEvenMoreFieldsButton.classList.add('hidden');
    resizePopup();
  });

  saveCodeButton.addEventListener('click', async () => {
    const userCode = userCodeInput.value;
    if (userCode) {
      saveCodeButton.disabled = true;
      saveCodeButton.innerHTML =
        '<i class="fa-solid fa-spinner"></i> Loading...';
      chrome.storage.sync.set({ userCode: userCode }, async () => {
        resizePopup();
      });
      const personalInformation = await fetchPersonalInformation(userCode);
      if (!personalInformation) {
        alert(
          'Failed to fetch personal information. Please enter your code again.'
        );
      }
      codeEntrySection.classList.add('hidden');
      actionSection.classList.remove('hidden');
      saveCodeButton.disabled = false;
      saveCodeButton.innerHTML = '<i class="fas fa-save"></i> Save Access Key';
    } else {
      alert('Please enter an access code.');
    }
  });

  fillApplicationButton.addEventListener('click', () => {
    chrome.storage.sync.get('userCode', async (result) => {
      if (!result.userCode) {
        alert('User code not found. Please enter your code again.');
        return;
      }
      fillApplicationButton.disabled = true;
      fillApplicationButton.innerHTML =
        '<i class="fa-solid fa-spinner"></i> Filling out application...';
      const personalInformation = await fetchPersonalInformation(
        result.userCode
      );
      if (!personalInformation) {
        fillApplicationButton.disabled = false;
        fillApplicationButton.innerHTML =
          '<i class="fas fa-edit"></i> Fill Out Application';
        return;
      }
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.scripting
            .executeScript({
              target: { tabId: tabs[0].id },
              func: fillJobApplicationForm,
              args: [personalInformation],
            })
            .then(() => {
              fillApplicationButton.disabled = false;
              fillApplicationButton.innerHTML =
                '<i class="fas fa-edit"></i> Fill Out Application';
            })
            .catch((error) => {
              console.error('Error filling out the page:', error);
              fillApplicationButton.disabled = false;
              fillApplicationButton.innerHTML =
                '<i class="fas fa-edit"></i> Fill Out Application';
            });
        } else {
          fillApplicationButton.disabled = false;
          fillApplicationButton.innerHTML =
            '<i class="fas fa-edit"></i> Fill Out Application';
          alert(
            'We cannot find the active tab. You cannot navigate to another tab or window after clicking the plugin icon. The plugin only is authorized to fill out forms on the active tab, which is found when you click the plugin icon while on the page you want to fill out. '
          );
        }
      });
    });
  });

  clearCodeButton.addEventListener('click', () => {
    clearCodeButton.disabled = true;
    clearCodeButton.innerHTML =
      '<i class="fa-solid fa-spinner"></i> Loading...';
    chrome.storage.sync.remove('userCode', () => {
      codeEntrySection.classList.remove('hidden');
      actionSection.classList.add('hidden');
      resizePopup();
      clearCodeButton.disabled = false;
      clearCodeButton.innerHTML =
        '<i class="fa-solid fa-user-lock"></i> Forget me';
    });
  });

  logApplicationButton.addEventListener('click', () => {
    actionSection.classList.add('hidden');
    logApplicationSection.classList.remove('hidden');
    resizePopup();
  });

  submitApplicationButton.addEventListener('click', async () => {
    const companyName = companyNameInput.value;
    const jobName = jobNameInput.value;
    const city = cityInput.value;
    const state = stateInput.value;
    const workMode = workModeInput.value;
    const payAmount = payAmountInput.value;
    const notes = notesInput.value;

    // Collect values from additional fields
    const salaryRangeMax = salaryRangeMaxInput.value;
    const salaryRangeMin = salaryRangeMinInput.value;
    const workType = workTypeInput.value;
    const industry = industryInput.value;
    const companySize = companySizeInput.value;
    const companyType = companyTypeInput.value;
    const companyDesirability = companyDesirabilityInput.value;
    const companyWebsite = companyWebsiteInput.value;
    const companyLinkedin = companyLinkedinInput.value;
    const streetAddress = streetAddressInput.value;
    const streetAddress2 = streetAddress2Input.value;
    const postalCode = postalCodeInput.value;
    const country = countryInput.value;
    const jobDescription = jobDescriptionInput.value;
    const payFrequency = payFrequencyInput.value;

    if (companyName && jobName) {
      submitApplicationButton.disabled = true;
      submitApplicationButton.innerHTML =
        '<i class="fa-solid fa-spinner"></i> Loading...';
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
                  ...(city && { city }),
                  ...(state && { state }),
                  ...(workMode && { workMode }),
                  ...(payAmount && { payAmount }),
                  ...(notes && { notes }),
                  ...(salaryRangeMax && { salaryRangeMax }),
                  ...(salaryRangeMin && { salaryRangeMin }),
                  ...(workType && { workType }),
                  ...(industry && { industry }),
                  ...(companySize && { companySize }),
                  ...(companyType && { companyType }),
                  ...(companyDesirability && { companyDesirability }),
                  ...(companyWebsite && { companyWebsite }),
                  ...(companyLinkedin && { companyLinkedin }),
                  ...(streetAddress && { streetAddress }),
                  ...(streetAddress2 && { streetAddress2 }),
                  ...(postalCode && { postalCode }),
                  ...(country && { country }),
                  ...(jobDescription && { jobDescription }),
                  ...(payFrequency && { payFrequency }),
                };
                const isSuccessful = await logJobApplication(payload);
                if (isSuccessful) {
                  alert('Job application logged successfully!');
                  logApplicationSection.classList.add('hidden');
                  actionSection.classList.remove('hidden');
                  resizePopup();
                  window.close();
                }
                submitApplicationButton.disabled = false;
                submitApplicationButton.innerHTML =
                  ' <i class="fas fa-paper-plane"></i> Submit';
              }
            }
          );
        } else {
          alert('User code not found. Please enter your code again.');
          submitApplicationButton.disabled = false;
          submitApplicationButton.innerHTML =
            ' <i class="fas fa-paper-plane"></i> Submit';
        }
      });
    } else {
      alert('Please fill in all fields.');
    }
  });

  function validateForm() {
    const companyName = companyNameInput.value.trim();
    const jobName = jobNameInput.value.trim();
    const payAmount = payAmountInput.value.trim();
    const regex = /^\d*(\.\d{0,2})?$/;

    let isValid = true;

    if (!companyName || !jobName) {
      isValid = false;
    }

    if (payAmount && !regex.test(payAmount)) {
      payErrorMessage.style.display = 'inline';
      isValid = false;
    } else {
      payErrorMessage.style.display = 'none';
    }

    submitApplicationButton.disabled = !isValid;
  }

  async function fetchPersonalInformation(userCode) {
    const url = `https://job-application-tracking-dev.vercel.app/api/plugin/getPersonalInformation?userCode=${userCode}`;
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        const personalInformation = await response.json();
        return personalInformation;
      } else {
        alert(
          `Failed to fetch personal information. Error message: ${response.statusText}`
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
        alert(`Failed to log job application: ${response.statusText}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error logging job application:', error);
      return false;
    }
  }

  resizePopup();

  async function fillJobApplicationForm(personalInfo) {
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

    const fieldNames = {
      addressLine1: [
        'address line 1',
        'address1',
        'street address 1',
        'street address',
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
        'name',
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
      'currentLocation',
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
      'expectedSalary',
    ];

    const allLabels = Array.from(document.querySelectorAll('label'));
    const allInputs = Array.from(
      document.querySelectorAll('input, select, textarea')
    );

    const fillInputField = (input, value) => {
      if (input.tagName.toLowerCase() === 'select') {
        Array.from(input.options).forEach((option) => {
          if (option.text.toLowerCase() === value.toLowerCase()) {
            input.value = option.value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      } else if (input.type === 'radio' || input.type === 'checkbox') {
        if (input.value.toLowerCase() === value.toLowerCase()) {
          input.checked = true;
          input.dispatchEvent(new Event('click', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        input.value = value;
        input.dispatchEvent(new Event('click', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    };

    const matchAndFillFields = (fieldNames, fieldValues) => {
      for (const key of fieldsToSearch) {
        const aliases = fieldNames[key];
        const value = fieldValues[key];

        allLabels.forEach((label) => {
          const labelText = label.textContent.trim().toLowerCase();
          aliases.forEach((alias) => {
            if (labelText.includes(alias)) {
              const inputId = label.getAttribute('for');
              const input = document.getElementById(inputId);
              if (input) {
                fillInputField(input, value);
              }
            }
          });
        });

        allInputs.forEach((input) => {
          const placeholder = input
            .getAttribute('placeholder')
            ?.trim()
            .toLowerCase();
          const nameAttr = input.getAttribute('name')?.trim().toLowerCase();
          const idAttr = input.getAttribute('id')?.trim().toLowerCase();

          aliases.forEach((alias) => {
            if (placeholder && placeholder.includes(alias)) {
              fillInputField(input, value);
            } else if (nameAttr && nameAttr.includes(alias)) {
              fillInputField(input, value);
            } else if (idAttr && idAttr.includes(alias)) {
              fillInputField(input, value);
            }
          });
        });
      }
    };

    try {
      matchAndFillFields(fieldNames, fieldValues);
    } catch (error) {
      console.error('Error in matching and filling fields:', error);
    }

    console.log('Form filling completed.');
  }
});
