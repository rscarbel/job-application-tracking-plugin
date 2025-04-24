document.addEventListener('DOMContentLoaded', () => {
  const actionSection = document.getElementById('actionSection');
  const backToMenuButton = document.getElementById('backToMenu');
  const cityInput = document.getElementById('city');
  const clearCodeButton = document.getElementById('clearCode');
  const closeButton = document.getElementById('closeButton');
  const codeEntrySection = document.getElementById('codeEntrySection');
  const companyLinkedinInput = document.getElementById('companyLinkedin');
  const companyNameInput = document.getElementById('companyName');
  const companySizeInput = document.getElementById('companySize');
  const companyTypeInput = document.getElementById('companyType');
  const companyWebsiteInput = document.getElementById('companyWebsite');
  const countryInput = document.getElementById('country');
  const createAccountButton = document.getElementById('createAccountBtn');
  const evenMoreHiddenFields = document.getElementById(
    'even-more-extra-fields'
  );
  const existingJobsList = document.getElementById('existingJobsList');
  const existingJobsSection = document.getElementById('existingJobs');
  const extraFields = document.getElementById('extraFields');
  const getAccessKeyButton = document.getElementById('getAccessKeyBtn');
  const industryInput = document.getElementById('industry');
  const jobDescriptionInput = document.getElementById('jobDescription');
  const jobNameInput = document.getElementById('jobName');
  const logApplicationButton = document.getElementById('logApplication');
  const logApplicationSection = document.getElementById(
    'logApplicationSection'
  );
  const notesInput = document.getElementById('notes');
  const payAmountInput = document.getElementById('payAmount');
  const payErrorMessage = document.getElementById('pay-error-message');
  const payFrequencyInput = document.getElementById('payFrequency');
  const postalCodeInput = document.getElementById('postalCode');
  const salaryRangeMaxInput = document.getElementById('salaryRangeMax');
  const salaryRangeMinInput = document.getElementById('salaryRangeMin');
  const saveCodeButton = document.getElementById('saveCode');
  const showEvenMoreFieldsButton =
    document.getElementById('showEvenMoreFields');
  const showExtraFieldsButton = document.getElementById('showMoreFields');
  const clearFieldsButton = document.getElementById('clearFieldsButton');
  const sourceInput = document.getElementById('source');
  const stateInput = document.getElementById('state');
  const streetAddress2Input = document.getElementById('streetAddress2');
  const streetAddressInput = document.getElementById('streetAddress');
  const submitApplicationButton = document.getElementById('submitApplication');
  const userCodeInput = document.getElementById('userCode');
  const workModeInput = document.getElementById('workMode');
  const workTypeInput = document.getElementById('workType');
  const customSelectTriggers = document.querySelectorAll(
    '.custom-select-trigger'
  );
  const payRangeToggle = document.getElementById('payRangeToggle');
  const payExactToggle = document.getElementById('payExactToggle');
  const payRangeContainer = document.getElementById('payRangeContainer');
  const payExactContainer = document.getElementById('payExactContainer');
  const currencyInput = document.getElementById('currency');
  const currencyWrapper = document.getElementById('currencyWrapper');
  const currencyOptions = document.getElementById('currencyOptions');

  customSelectTriggers.forEach((trigger) => {
    trigger.addEventListener('click', function () {
      const select = this.parentNode;
      select.classList.toggle('open');

      if (select.classList.contains('open')) {
        const options = select.querySelector('.custom-options');

        // Remove any existing indicator first
        const existingIndicator = select.querySelector('.scroll-indicator');
        if (existingIndicator) {
          existingIndicator.remove();
        }

        // Only add scroll indicator if scrolling is needed
        setTimeout(() => {
          if (options.scrollHeight > options.clientHeight + 5) {
            // Adding small buffer for safety
            const indicator = document.createElement('div');
            indicator.className = 'scroll-indicator';
            indicator.innerHTML = '<i class="fas fa-chevron-down"></i>';
            options.appendChild(indicator);

            // Make the indicator functional
            indicator.addEventListener('click', function (e) {
              e.stopPropagation();
              const scrollAmount = 40; // Scroll by 40px on each click
              options.scrollTop += scrollAmount;
            });

            // Update indicator visibility based on scroll position
            const updateIndicatorVisibility = function () {
              const scrollableDistance =
                options.scrollHeight - options.clientHeight;
              const scrollPercent = options.scrollTop / scrollableDistance;

              if (scrollPercent > 0.8) {
                // Nearly at the bottom
                indicator.style.opacity = '0';
              } else {
                indicator.style.opacity = '1';
              }
            };

            // Initial check
            updateIndicatorVisibility();

            // Listen for scroll events
            options.addEventListener('scroll', updateIndicatorVisibility, {
              passive: true,
            });
          }
        }, 10); // Small timeout to ensure the dropdown is fully expanded
      }

      // Close all other dropdowns
      document.querySelectorAll('.custom-select').forEach((otherSelect) => {
        if (otherSelect !== select) {
          otherSelect.classList.remove('open');
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function closeDropdown(e) {
        if (!select.contains(e.target)) {
          select.classList.remove('open');
          document.removeEventListener('click', closeDropdown);
        }
      });
    });
  });

  // Add option selection functionality
  document.querySelectorAll('.custom-option').forEach((option) => {
    option.addEventListener('click', function () {
      const select = this.closest('.custom-select');
      const trigger = select.querySelector(
        '.custom-select-trigger .custom-select-value'
      );
      const hiddenInput = select.nextElementSibling;

      // Update the visible value and hidden input
      trigger.textContent = this.textContent;
      hiddenInput.value = this.getAttribute('data-value');

      // Mark this option as selected
      select.querySelectorAll('.custom-option').forEach((opt) => {
        opt.classList.remove('selected');
      });
      this.classList.add('selected');

      // Close the dropdown
      select.classList.remove('open');

      // Trigger a change event on the hidden input
      const changeEvent = new Event('input', { bubbles: true });
      hiddenInput.dispatchEvent(changeEvent);
    });
  });

  let cachedCompanyNames = null;

  function resizePopup() {
    const container = document.querySelector('.container');
    document.body.style.height = container.scrollHeight + 'px';
    window.resizeTo(document.body.scrollWidth, document.body.scrollHeight);
  }

  closeButton.addEventListener('click', () => {
    cachedCompanyNames = null;
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

  companyNameInput.addEventListener(
    'input',
    debounce(async () => {
      const userCode = (await chrome.storage.sync.get('userCode')).userCode;
      if (!cachedCompanyNames && userCode) {
        cachedCompanyNames = await fetchCompanyNames(userCode);
      }
      const companyName = companyNameInput.value.trim();
      checkForExistingJobs(companyName);
    }, 300)
  );

  salaryRangeMinInput.addEventListener('input', validateSalaryField);
  salaryRangeMaxInput.addEventListener('input', validateSalaryField);
  payAmountInput.addEventListener('input', validateSalaryField);

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
        companyLinkedinInput,
        companySizeInput,
        companyTypeInput,
        companyWebsiteInput,
        countryInput,
        industryInput,
        jobDescriptionInput,
        notesInput,
        payAmountInput,
        payFrequencyInput,
        postalCodeInput,
        salaryRangeMaxInput,
        salaryRangeMinInput,
        sourceInput,
        stateInput,
        streetAddress2Input,
        streetAddressInput,
        workModeInput,
        workTypeInput,
      ].forEach((input) => {
        input.value = '';
      });
    }
    resizePopup();
  });

  createAccountButton.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://www.jobapplicationtracking.com',
    });
  });

  getAccessKeyButton.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://www.jobapplicationtracking.com/settings?tab=manage-personal-info',
    });
  });

  showEvenMoreFieldsButton.addEventListener('click', () => {
    evenMoreHiddenFields.classList.remove('hidden');
    showEvenMoreFieldsButton.classList.add('hidden');
    resizePopup();
  });

  backToMenuButton.addEventListener('click', () => {
    logApplicationSection.classList.add('hidden');
    actionSection.classList.remove('hidden');

    // Clear all input fields
    [
      cityInput,
      companyLinkedinInput,
      companyNameInput,
      companySizeInput,
      companyTypeInput,
      companyWebsiteInput,
      countryInput,
      industryInput,
      jobDescriptionInput,
      jobNameInput,
      notesInput,
      payAmountInput,
      payFrequencyInput,
      postalCodeInput,
      salaryRangeMaxInput,
      salaryRangeMinInput,
      sourceInput,
      stateInput,
      streetAddress2Input,
      streetAddressInput,
      workModeInput,
      workTypeInput,
    ].forEach((input) => {
      input.value = '';
    });

    // Reset all custom dropdowns
    document.querySelectorAll('.custom-select-value').forEach((value) => {
      const selectId = value.closest('.custom-select-wrapper').id;

      if (selectId === 'workModeWrapper') {
        value.textContent = 'Select work mode';
      } else if (selectId === 'workTypeWrapper') {
        value.textContent = 'Select work type';
      } else if (selectId === 'industryWrapper') {
        value.textContent = 'Select industry';
      } else if (selectId === 'companySizeWrapper') {
        value.textContent = 'Select company size';
      } else if (selectId === 'companyTypeWrapper') {
        value.textContent = 'Select company type';
      } else if (selectId === 'payFrequencyWrapper') {
        value.textContent = 'Select pay frequency';
      }
    });

    document.querySelectorAll('.custom-option').forEach((option) => {
      option.classList.remove('selected');
    });

    // Make sure the warning is hidden
    existingJobsSection.classList.add('hidden');

    cachedCompanyNames = null;
    resizePopup();
  });

  payRangeToggle.addEventListener('change', function () {
    if (this.checked) {
      payRangeContainer.classList.remove('hidden');
      payExactContainer.classList.add('hidden');
      payAmountInput.value = '';
    }
    resizePopup();
    validateForm();
  });

  payExactToggle.addEventListener('change', function () {
    if (this.checked) {
      payRangeContainer.classList.add('hidden');
      payExactContainer.classList.remove('hidden');
      salaryRangeMinInput.value = '';
      salaryRangeMaxInput.value = '';
    }
    resizePopup();
    validateForm();
  });

  userCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveCodeButton.click();
    }
  });

  saveCodeButton.addEventListener('click', async () => {
    const userCode = userCodeInput.value;
    if (userCode) {
      saveCodeButton.disabled = true;
      saveCodeButton.innerHTML = '<i class="fa-solid fa-spinner"></i>';
      const personalInformation = await fetchPersonalInformation(userCode);
      if (!personalInformation) {
        alert(
          'Failed to fetch personal information. Please enter your code again.'
        );
        saveCodeButton.disabled = false;
        saveCodeButton.innerHTML =
          '<i class="fas fa-sign-in-alt color-white"></i>';
        return;
      }
      chrome.storage.sync.set({ userCode: userCode }, async () => {
        resizePopup();
      });
      codeEntrySection.classList.add('hidden');
      actionSection.classList.remove('hidden');
      saveCodeButton.disabled = false;
      saveCodeButton.innerHTML =
        '<i class="fas fa-sign-in-alt color-white"></i>';
    } else {
      alert('Please enter an access code.');
    }
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

  logApplicationButton.addEventListener('click', async () => {
    actionSection.classList.add('hidden');
    cachedCompanyNames = null;

    console.log('Log application button clicked');

    await chrome.tabs.query(
      { active: true, currentWindow: true },
      async (tabs) => {
        const tab = tabs[0];
        if (tab) {
          console.log('Tab found:', tab);
          // Show loading state
          logApplicationButton.disabled = true;
          logApplicationButton.innerHTML =
            '<i class="fa-solid fa-spinner"></i> Detecting job details...';

          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['parser-utils.js'],
            });

            await Promise.all([
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['linkedin-parser.js'],
              }),
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['indeed-parser.js'],
              }),
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['default-parser.js'],
              }),
            ]);

            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['detectJobDetails.js'],
            });

            const [result] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                console.log('Attempting to call detectJobDetails');
                return window.detectJobDetails
                  ? window.detectJobDetails()
                  : null;
              },
            });

            const jobDetails = result?.result;

            if (jobDetails) {
              console.log('Job details detected:', jobDetails);
              // Populate form with detected details
              populateJobApplicationForm(jobDetails);
            } else {
              // Fallback to just setting the source as before
              console.log('No job details detected, setting source only');
              const url = new URL(tab.url);
              sourceInput.value = getWebsiteHostDisplayName(url.host);
            }
          } catch (error) {
            console.error('Error detecting job details:', error);
            // Fallback to just setting the source as before
            const url = new URL(tab.url);
            sourceInput.value = getWebsiteHostDisplayName(url.host);
          } finally {
            // Reset button state
            logApplicationButton.disabled = false;
            logApplicationButton.innerHTML =
              '<i class="fas fa-clipboard-list mr-10 color-white"></i> Log Application';
          }
        }
      }
    );

    logApplicationSection.classList.remove('hidden');
    resizePopup();
  });

  clearFieldsButton.addEventListener('click', () => {
    clearAllFields();
    validateForm();
  });

  function validateSalaryField(event) {
    const regex = /^\d*(\.\d{0,2})?$/;
    const field = event.target;

    // Save the cursor position
    const cursorPosition = field.selectionStart;

    if (field.value && !regex.test(field.value)) {
      // Invalid input - revert to previous valid value or empty
      field.value = field.value.replace(/[^\d.]/g, ''); // Remove non-numeric and non-decimal characters

      // Ensure only one decimal point
      const parts = field.value.split('.');
      if (parts.length > 2) {
        field.value = parts[0] + '.' + parts.slice(1).join('');
      }

      // Ensure only two decimal places
      if (parts.length > 1 && parts[1].length > 2) {
        field.value = parts[0] + '.' + parts[1].substring(0, 2);
      }

      // Set cursor position while preventing it from jumping
      setTimeout(() => {
        field.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
      }, 0);

      payErrorMessage.style.display = 'inline';
    } else {
      payErrorMessage.style.display = 'none';
    }

    validateForm();
  }

  function populateJobApplicationForm(jobDetails) {
    // Only set values if they exist and are non-empty
    if (jobDetails.companyName) {
      companyNameInput.value = jobDetails.companyName;
      companyNameInput.dispatchEvent(new Event('input'));
    }

    if (jobDetails.jobTitle) {
      jobNameInput.value = jobDetails.jobTitle;
    }

    if (jobDetails.source) {
      sourceInput.value = getWebsiteHostDisplayName(jobDetails.source);
    }

    // Location details
    if (jobDetails.location) {
      if (jobDetails.location.city) cityInput.value = jobDetails.location.city;
      if (jobDetails.location.state)
        stateInput.value = jobDetails.location.state;
      if (jobDetails.location.country)
        countryInput.value = jobDetails.location.country;
      if (jobDetails.location.postalCode)
        postalCodeInput.value = jobDetails.location.postalCode;
      if (jobDetails.location.streetAddress)
        streetAddressInput.value = jobDetails.location.streetAddress;
      if (jobDetails.location.streetAddress2)
        streetAddress2Input.value = jobDetails.location.streetAddress2;
    }

    if (jobDetails.compensation) {
      if (jobDetails.compensation) {
        if (isValidSalaryData(jobDetails.compensation.payAmount)) {
          payAmountInput.value = jobDetails.compensation.payAmount;
          payExactToggle.checked = true;
          payRangeToggle.checked = false;
          payRangeContainer.classList.add('hidden');
          payExactContainer.classList.remove('hidden');
          payAmountInput.dispatchEvent(new Event('input'));
        } else if (
          isValidSalaryData(jobDetails.compensation.salaryRangeMin) ||
          isValidSalaryData(jobDetails.compensation.salaryRangeMax)
        ) {
          payRangeToggle.checked = true;
          payExactToggle.checked = false;
          payRangeContainer.classList.remove('hidden');
          payExactContainer.classList.add('hidden');
        }

        if (isValidSalaryData(jobDetails.compensation.salaryRangeMin)) {
          salaryRangeMinInput.value = jobDetails.compensation.salaryRangeMin;
        }

        if (isValidSalaryData(jobDetails.compensation.salaryRangeMax)) {
          salaryRangeMaxInput.value = jobDetails.compensation.salaryRangeMax;
        }
      }

      if (jobDetails.compensation.payFrequency) {
        setCustomSelectValue(
          'payFrequencyWrapper',
          jobDetails.compensation.payFrequency
        );
      }

      if (jobDetails.compensation.currency) {
        currencyInput.value = jobDetails.compensation.currency;
      }
    }

    if (jobDetails.companyDetails) {
      if (jobDetails.companyDetails.industry) {
        setCustomSelectValue(
          'industryWrapper',
          jobDetails.companyDetails.industry
        );
      }

      if (jobDetails.jobDetails.workMode) {
        setCustomSelectValue('workModeWrapper', jobDetails.jobDetails.workMode);
      }

      if (jobDetails.jobDetails.workType) {
        setCustomSelectValue('workTypeWrapper', jobDetails.jobDetails.workType);
      }

      if (jobDetails.jobDetails.description) {
        jobDescriptionInput.value = jobDetails.jobDetails.description;
      }
    }

    if (jobDetails.companyDetails) {
      if (jobDetails.companyDetails.website) {
        companyWebsiteInput.value = jobDetails.companyDetails.website;
      }

      if (jobDetails.companyDetails.linkedin) {
        companyLinkedinInput.value = jobDetails.companyDetails.linkedin;
      }

      if (jobDetails.companyDetails.size) {
        setCustomSelectValue(
          'companySizeWrapper',
          jobDetails.companyDetails.size
        );
      }

      if (jobDetails.companyDetails.type) {
        setCustomSelectValue(
          'companyTypeWrapper',
          jobDetails.companyDetails.type
        );
      }
    }

    if (jobDetails.jobDescription) {
      jobDescriptionInput.value = jobDetails.jobDescription;
    }
    validateForm();
  }

  function clearAllFields() {
    [
      cityInput,
      companyLinkedinInput,
      companyNameInput,
      companySizeInput,
      companyTypeInput,
      companyWebsiteInput,
      countryInput,
      industryInput,
      jobDescriptionInput,
      jobNameInput,
      notesInput,
      payAmountInput,
      payFrequencyInput,
      postalCodeInput,
      salaryRangeMaxInput,
      salaryRangeMinInput,
      sourceInput,
      stateInput,
      streetAddress2Input,
      streetAddressInput,
      workModeInput,
      workTypeInput,
    ].forEach((input) => {
      input.value = '';
    });

    currencyInput.value = 'USD';
    const currencyTrigger = currencyWrapper.querySelector(
      '.custom-select-trigger .custom-select-value'
    );
    if (currencyTrigger) {
      currencyTrigger.textContent = 'USD';
    }
    document
      .querySelectorAll('#currencyOptions .custom-option')
      .forEach((option) => {
        option.classList.remove('selected');
        if (option.getAttribute('data-value') === 'USD') {
          option.classList.add('selected');
        }
      });

    payRangeToggle.checked = true;
    payExactToggle.checked = false;
    payRangeContainer.classList.remove('hidden');
    payExactContainer.classList.add('hidden');
    currencyInput.value = 'USD';

    document.querySelectorAll('.custom-select-value').forEach((value) => {
      const selectId = value.closest('.custom-select-wrapper').id;

      if (selectId === 'workModeWrapper') {
        value.textContent = 'Select work mode';
      } else if (selectId === 'workTypeWrapper') {
        value.textContent = 'Select work type';
      } else if (selectId === 'industryWrapper') {
        value.textContent = 'Select industry';
      } else if (selectId === 'companySizeWrapper') {
        value.textContent = 'Select company size';
      } else if (selectId === 'companyTypeWrapper') {
        value.textContent = 'Select company type';
      } else if (selectId === 'payFrequencyWrapper') {
        value.textContent = 'Select pay frequency';
      }
    });

    document.querySelectorAll('.custom-option').forEach((option) => {
      option.classList.remove('selected');
    });

    // Hide additional fields sections if they're open
    if (!extraFields.classList.contains('hidden')) {
      extraFields.classList.add('hidden');
      showExtraFieldsButton.innerHTML =
        '<i class="fas fa-plus mr-10 color-white"></i> Show More Fields';
      showEvenMoreFieldsButton.classList.add('hidden');
    }

    if (!evenMoreHiddenFields.classList.contains('hidden')) {
      evenMoreHiddenFields.classList.add('hidden');
    }

    // Make sure the warning is hidden
    existingJobsSection.classList.add('hidden');

    resizePopup();
  }

  function setCustomSelectValue(wrapperId, value) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const hiddenInput = wrapper.nextElementSibling;
    if (!hiddenInput) return;

    const options = wrapper.querySelectorAll('.custom-option');
    let found = false;

    options.forEach((option) => {
      if (
        option.getAttribute('data-value').toUpperCase() === value.toUpperCase()
      ) {
        // Trigger a click on the matching option
        option.click();
        found = true;
      }
    });

    if (!found && value) {
      // If no exact match but we have a value, try to set it directly
      hiddenInput.value = value;
      const trigger = wrapper.querySelector(
        '.custom-select-trigger .custom-select-value'
      );
      if (trigger) {
        trigger.textContent = value;
      }
    }
  }

  submitApplicationButton.addEventListener('click', async () => {
    if (!validateForm()) {
      return;
    }
    const city = cityInput.value;
    const companyLinkedin = companyLinkedinInput.value;
    const companyName = companyNameInput.value;
    const companySize = companySizeInput.value;
    const companyType = companyTypeInput.value;
    const companyWebsite = companyWebsiteInput.value;
    const country = countryInput.value;
    const industry = industryInput.value;
    const jobDescription = jobDescriptionInput.value;
    const jobName = jobNameInput.value;
    const notes = notesInput.value;
    const payAmount = payAmountInput.value;
    const payFrequency = payFrequencyInput.value;
    const postalCode = postalCodeInput.value;
    const salaryRangeMax = salaryRangeMaxInput.value;
    const salaryRangeMin = salaryRangeMinInput.value;
    const source = sourceInput.value;
    const state = stateInput.value;
    const streetAddress = streetAddressInput.value;
    const streetAddress2 = streetAddress2Input.value;
    const workMode = workModeInput.value;
    const workType = workTypeInput.value;
    const currency = currencyInput.value || 'USD';

    if (companyName && jobName) {
      submitApplicationButton.disabled = true;
      submitApplicationButton.innerHTML =
        '<i class="fa-solid fa-spinner"></i> Loading...';
      await chrome.storage.sync.get('userCode', async (result) => {
        const userCode = result.userCode;
        if (userCode) {
          await chrome.tabs.query(
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
                  currency,
                  ...(city && { city }),
                  ...(companyLinkedin && { companyLinkedin }),
                  ...(companySize && { companySize }),
                  ...(companyType && { companyType }),
                  ...(companyWebsite && { companyWebsite }),
                  ...(country && { country }),
                  ...(industry && { industry }),
                  ...(jobDescription && { jobDescription }),
                  ...(notes && { notes }),
                  ...(payAmount && { payAmount }),
                  ...(payFrequency && { payFrequency }),
                  ...(postalCode && { postalCode }),
                  ...(salaryRangeMax && { salaryRangeMax }),
                  ...(salaryRangeMin && { salaryRangeMin }),
                  ...(source && { source }),
                  ...(state && { state }),
                  ...(streetAddress && { streetAddress }),
                  ...(streetAddress2 && { streetAddress2 }),
                  ...(workMode && { workMode }),
                  ...(workType && { workType }),
                  ...(payRangeToggle.checked &&
                    salaryRangeMin && { salaryRangeMin }),
                  ...(payRangeToggle.checked &&
                    salaryRangeMax && { salaryRangeMax }),
                  ...(payExactToggle.checked && payAmount && { payAmount }),
                };
                const isSuccessful = await logJobApplication(payload);
                if (isSuccessful) {
                  alert('Job application logged successfully!');
                  logApplicationSection.classList.add('hidden');
                  actionSection.classList.remove('hidden');
                  cachedCompanyNames = null;
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
    const salaryRangeMin = salaryRangeMinInput.value.trim();
    const salaryRangeMax = salaryRangeMaxInput.value.trim();
    const regex = /^\d*(\.\d{0,2})?$/;

    let isValid = true;

    if (!companyName || !jobName) {
      isValid = false;
    }

    // Check for empty fields (this prevents submitting with empty salary fields)
    if (payExactToggle.checked) {
      // If exact pay is selected, either payAmount should be empty or valid
      if (payAmount && !regex.test(payAmount)) {
        payErrorMessage.style.display = 'inline';
        isValid = false;
      } else {
        payErrorMessage.style.display = 'none';
      }
    } else if (payRangeToggle.checked) {
      // If range is selected, both min and max should be either empty or valid
      if (
        (salaryRangeMin && !regex.test(salaryRangeMin)) ||
        (salaryRangeMax && !regex.test(salaryRangeMax))
      ) {
        payErrorMessage.style.display = 'inline';
        isValid = false;
      } else if (
        salaryRangeMin &&
        salaryRangeMax &&
        parseFloat(salaryRangeMin) > parseFloat(salaryRangeMax)
      ) {
        // Additional check: min shouldn't be greater than max
        payErrorMessage.textContent =
          'Minimum salary cannot be greater than maximum salary';
        payErrorMessage.style.display = 'inline';
        isValid = false;
      } else {
        payErrorMessage.textContent =
          'Please enter a valid amount with up to two decimal places.';
        payErrorMessage.style.display = 'none';
      }
    }

    submitApplicationButton.disabled = !isValid;
    return isValid;
  }

  async function fetchPersonalInformation(userCode) {
    const url = `https://www.jobapplicationtracking.com/api/plugin/getPersonalInformation/v1?userCode=${userCode}`;
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

  async function fetchCompanyNames(userCode) {
    const url = `https://www.jobapplicationtracking.com/api/plugin/getCompanyNames/v2/${userCode}`;
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        return await response.json();
      } else {
        console.error(
          `Failed to fetch companyNames information. Error message: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error('Error fetching company names:', error);
    }
  }

  async function logJobApplication(payload) {
    const url =
      'https://www.jobapplicationtracking.com/api/plugin/logApplication/v1';
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

  function initializeCurrencyDropdown() {
    // Check if validCurrencies exists (from currencies.js)
    if (typeof validCurrencies !== 'undefined') {
      // Clear existing options except USD (which we keep as default)
      currencyOptions.innerHTML =
        '<div class="custom-option selected" data-value="USD">USD - US Dollar</div>';

      // Add all currencies except USD (since we already have it)
      validCurrencies.forEach((currencyCode) => {
        if (currencyCode !== 'USD') {
          try {
            let label = currencyCode;
            // Try to get formatted currency name if available
            try {
              const formatter = new Intl.DisplayNames(['en'], {
                type: 'currency',
              });
              label = `${currencyCode} - ${formatter.of(currencyCode)}`;
            } catch (error) {
              // Fallback if Intl.DisplayNames is not supported
            }

            const option = document.createElement('div');
            option.className = 'custom-option';
            option.setAttribute('data-value', currencyCode);
            option.textContent = label;
            currencyOptions.appendChild(option);
          } catch (error) {
            console.error(`Error adding currency ${currencyCode}:`, error);
          }
        }
      });

      // Add event listeners to the currency options
      document
        .querySelectorAll('#currencyOptions .custom-option')
        .forEach((option) => {
          option.addEventListener('click', function () {
            const select = this.closest('.custom-select');
            const trigger = select.querySelector(
              '.custom-select-trigger .custom-select-value'
            );
            const hiddenInput = select.nextElementSibling;

            // Update the visible value and hidden input
            trigger.textContent = this.getAttribute('data-value');
            hiddenInput.value = this.getAttribute('data-value');

            // Mark this option as selected
            select.querySelectorAll('.custom-option').forEach((opt) => {
              opt.classList.remove('selected');
            });
            this.classList.add('selected');

            // Close the dropdown
            select.classList.remove('open');

            // Trigger a change event on the hidden input
            const changeEvent = new Event('input', { bubbles: true });
            hiddenInput.dispatchEvent(changeEvent);
          });
        });
    } else {
      console.warn('validCurrencies not loaded yet, will retry');
      setTimeout(initializeCurrencyDropdown, 100);
    }
  }

  function checkForExistingJobs(companyName) {
    if (!cachedCompanyNames) return;

    const normalizedCompanyName = companyName.toLowerCase().replace(/\s+/g, '');
    const matchedCompany =
      cachedCompanyNames.currentApplicationGroup.companies[
        normalizedCompanyName
      ];

    if (matchedCompany) {
      const { latestApplication, allApplications } = matchedCompany;

      const latestDate = new Date(latestApplication.applicationDate);
      const formattedDate = latestDate.toLocaleDateString();

      let jobListHtml = `
      <li>
        <strong>${latestApplication.jobTitle}</strong> 
        <span class="application-date">(${formattedDate})</span>
      </li>
    `;

      // Add "See more" dropdown if there are multiple applications
      if (allApplications.length > 1) {
        jobListHtml += `
        <li class="see-more-container">
          <a href="#" id="seeMoreApplications">See ${
            allApplications.length - 1
          } more...</a>
          <ul id="additionalApplications" class="hidden">
      `;

        // Add all applications except the latest one
        allApplications.slice(1).forEach((app) => {
          const appDate = new Date(app.applicationDate);
          const appFormattedDate = appDate.toLocaleDateString();
          jobListHtml += `
          <li>
            <strong>${app.jobTitle}</strong> 
            <span class="application-date">(${appFormattedDate})</span>
          </li>
        `;
        });

        jobListHtml += `</ul></li>`;
      }

      existingJobsList.innerHTML = jobListHtml;
      existingJobsSection.classList.remove('hidden');

      const seeMoreLink = document.getElementById('seeMoreApplications');
      if (seeMoreLink) {
        seeMoreLink.addEventListener('click', (e) => {
          e.preventDefault();
          const additionalApplications = document.getElementById(
            'additionalApplications'
          );
          if (additionalApplications.classList.contains('hidden')) {
            additionalApplications.classList.remove('hidden');
            seeMoreLink.textContent = `Hide ${
              allApplications.length - 1
            } more...`;
          } else {
            additionalApplications.classList.add('hidden');
            seeMoreLink.textContent = `See ${
              allApplications.length - 1
            } more...`;
          }
          resizePopup();
        });
      }
    } else {
      existingJobsList.innerHTML = '';
      existingJobsSection.classList.add('hidden');
    }
    resizePopup();
  }

  // Debounce function to limit API calls
  function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  }

  function isValidSalaryData(value) {
    if (!value) return false;

    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num > 0;
  }

  function getWebsiteHostDisplayName(host) {
    const knownSites = {
      'www.linkedin.com': 'LinkedIn',
      'linkedin.com': 'LinkedIn',
      'www.indeed.com': 'Indeed',
      'indeed.com': 'Indeed',
      'www.workday.com': 'Workday',
      'workday.com': 'Workday',
      'www.glassdoor.com': 'Glassdoor',
      'glassdoor.com': 'Glassdoor',
      'www.monster.com': 'Monster',
      'monster.com': 'Monster',
      'www.simplyhired.com': 'SimplyHired',
      'simplyhired.com': 'SimplyHired',
      'www.ziprecruiter.com': 'ZipRecruiter',
      'ziprecruiter.com': 'ZipRecruiter',
      'www.careerbuilder.com': 'CareerBuilder',
      'careerbuilder.com': 'CareerBuilder',
      'www.snagajob.com': 'Snagajob',
      'snagajob.com': 'Snagajob',
      'www.flexjobs.com': 'FlexJobs',
      'flexjobs.com': 'FlexJobs',
      'www.roberthalf.com': 'Robert Half',
      'roberthalf.com': 'Robert Half',
      'www.job.com': 'Job.com',
      'job.com': 'Job.com',
      'www.upwork.com': 'Upwork',
      'upwork.com': 'Upwork',
      'www.fiverr.com': 'Fiverr',
      'fiverr.com': 'Fiverr',
      'www.remote.co': 'Remote.co',
      'remote.co': 'Remote.co',
      'www.remoteok.com': 'Remote OK',
      'remoteok.com': 'Remote OK',
      'www.angel.co': 'AngelList',
      'angel.co': 'AngelList',
      'www.theladders.com': 'The Ladders',
      'theladders.com': 'The Ladders',
      'www.hired.com': 'Hired',
      'hired.com': 'Hired',
      'www.dice.com': 'Dice',
      'dice.com': 'Dice',
      'www.builtin.com': 'Built In',
      'builtin.com': 'Built In',
      'www.guru.com': 'Guru',
      'guru.com': 'Guru',
      'www.beyond.com': 'Beyond',
      'beyond.com': 'Beyond',
      'www.startwire.com': 'StartWire',
      'startwire.com': 'StartWire',
      'www.jobs2careers.com': 'Jobs2Careers',
      'jobs2careers.com': 'Jobs2Careers',
      'www.ladders.com': 'Ladders',
      'ladders.com': 'Ladders',
      'www.remoteworkhub.com': 'Remote Work Hub',
      'remoteworkhub.com': 'Remote Work Hub',
      'www.wayup.com': 'WayUp',
      'wayup.com': 'WayUp',
      'www.collegegrad.com': 'CollegeGrad',
      'collegegrad.com': 'CollegeGrad',
      'www.usajobs.gov': 'USAJobs',
      'usajobs.gov': 'USAJobs',
      'www.devex.com': 'Devex',
      'devex.com': 'Devex',
      'www.idealist.org': 'Idealist',
      'idealist.org': 'Idealist',
      'www.mediabistro.com': 'Mediabistro',
      'mediabistro.com': 'Mediabistro',
      'www.authenticjobs.com': 'Authentic Jobs',
      'authenticjobs.com': 'Authentic Jobs',
      'www.toptal.com': 'Toptal',
      'toptal.com': 'Toptal',
      'www.freelancer.com': 'Freelancer',
      'freelancer.com': 'Freelancer',
      'www.naukri.com': 'Naukri',
      'naukri.com': 'Naukri',
      'www.shine.com': 'Shine',
      'shine.com': 'Shine',
      'www.efinancialcareers.com': 'eFinancialCareers',
      'efinancialcareers.com': 'eFinancialCareers',
      'www.craigslist.org': 'Craigslist',
      'craigslist.org': 'Craigslist',
      'www.bayt.com': 'Bayt',
      'bayt.com': 'Bayt',
      'www.jobstreet.com': 'JobStreet',
      'jobstreet.com': 'JobStreet',
      'www.reed.co.uk': 'Reed',
      'reed.co.uk': 'Reed',
      'www.totaljobs.com': 'Totaljobs',
      'totaljobs.com': 'Totaljobs',
      'www.cv-library.co.uk': 'CV-Library',
      'cv-library.co.uk': 'CV-Library',
      'www.adzuna.com': 'Adzuna',
      'adzuna.com': 'Adzuna',
      'www.cwjobs.co.uk': 'CWJobs',
      'cwjobs.co.uk': 'CWJobs',
      'www.jobserve.com': 'JobServe',
      'jobserve.com': 'JobServe',
      'www.techcareers.com': 'TechCareers',
      'techcareers.com': 'TechCareers',
      'www.thingamajob.com': 'Thingamajob',
      'thingamajob.com': 'Thingamajob',
      'www.rigzone.com': 'Rigzone',
      'rigzone.com': 'Rigzone',
      'www.dice.co.uk': 'Dice UK',
      'dice.co.uk': 'Dice UK',
      'www.ventureloop.com': 'VentureLoop',
      'ventureloop.com': 'VentureLoop',
      'www.jobsinnetwork.com': 'JobsInNetwork',
      'jobsinnetwork.com': 'JobsInNetwork',
      'www.healthcareers.com': 'HealthCareers',
      'healthcareers.com': 'HealthCareers',
      'www.environmentalcareer.com': 'Environmental Career',
      'environmentalcareer.com': 'Environmental Career',
      'www.devjobsscanner.com': 'DevJobsScanner',
      'devjobsscanner.com': 'DevJobsScanner',
      'www.aviationjobsearch.com': 'Aviation Job Search',
      'aviationjobsearch.com': 'Aviation Job Search',
      'www.tefl.com': 'TEFL',
      'tefl.com': 'TEFL',
      'www.careerbliss.com': 'CareerBliss',
      'careerbliss.com': 'CareerBliss',
      'www.getwork.com': 'Getwork',
      'getwork.com': 'Getwork',
      'www.jobcase.com': 'Jobcase',
      'jobcase.com': 'Jobcase',
      'www.wonderfuljobs.com': 'Wonderful Jobs',
      'wonderfuljobs.com': 'Wonderful Jobs',
      'www.fish4.co.uk': 'Fish4Jobs',
      'fish4.co.uk': 'Fish4Jobs',
      'www.hosco.com': 'Hosco',
      'hosco.com': 'Hosco',
      'www.thejobnetwork.com': 'TheJobNetwork',
      'thejobnetwork.com': 'TheJobNetwork',
      'www.jobsora.com': 'Jobsora',
      'jobsora.com': 'Jobsora',
      'www.glassdoor.co.uk': 'Glassdoor UK',
      'glassdoor.co.uk': 'Glassdoor UK',
      'www.jobisjob.co.uk': 'JobisJob',
      'jobisjob.co.uk': 'JobisJob',
      'www.jobrapido.com': 'Jobrapido',
      'jobrapido.com': 'Jobrapido',
      'www.recruit.net': 'Recruit.net',
      'recruit.net': 'Recruit.net',
      'www.jobtome.com': 'Jobtome',
      'jobtome.com': 'Jobtome',
      'www.talent.com': 'Talent.com',
      'talent.com': 'Talent.com',
      'www.neuvoo.com': 'Neuvoo',
      'neuvoo.com': 'Neuvoo',
      'www.jobleads.com': 'JobLeads',
      'jobleads.com': 'JobLeads',
      'www.glassdoor.de': 'Glassdoor Germany',
      'glassdoor.de': 'Glassdoor Germany',
    };

    if (knownSites[host]) return knownSites[host];

    if (host.startsWith('www.')) host = host.slice(4);
    const parts = host.split('.');
    if (parts.length > 3) {
      host = parts.slice(0, -1).join('.');
    } else if (parts.length === 3) {
      host = parts[1];
    } else if (parts.length === 2) {
      host = parts[0];
    }

    return capitalizeFirstLetter(host);
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  initializeCurrencyDropdown();
  resizePopup();
});
