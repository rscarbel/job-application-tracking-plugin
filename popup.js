document.addEventListener('DOMContentLoaded', () => {
  const actionSection = document.getElementById('actionSection');
  const backToMenuButton = document.getElementById('backToMenu');
  const cityInput = document.getElementById('city');
  const clearCodeButton = document.getElementById('clearCode');
  const closeButton = document.getElementById('closeButton');
  const codeEntrySection = document.getElementById('codeEntrySection');
  const companyDesirabilityInput = document.getElementById(
    'companyDesireability'
  );
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
  const fillApplicationButton = document.getElementById('fillApplication');
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
  const workTypeWrapper = document.getElementById('workTypeWrapper');
  const industryWrapper = document.getElementById('industryWrapper');
  const companySizeWrapper = document.getElementById('companySizeWrapper');
  const companyTypeWrapper = document.getElementById('companyTypeWrapper');
  const companyDesireabilityWrapper = document.getElementById(
    'companyDesireabilityWrapper'
  );
  const payFrequencyWrapper = document.getElementById('payFrequencyWrapper');

  customSelectTriggers.forEach((trigger) => {
    trigger.addEventListener('click', function () {
      const select = this.parentNode;
      select.classList.toggle('open');

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
        companyDesirabilityInput,
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
      companyDesirabilityInput,
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
      } else if (selectId === 'companyDesireabilityWrapper') {
        value.textContent = 'Select desirability';
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

  fillApplicationButton.addEventListener('click', async () => {
    await chrome.storage.sync.get('userCode', async (result) => {
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
      await chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        async (tabs) => {
          if (tabs[0]) {
            await chrome.scripting
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
        }
      );
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

  logApplicationButton.addEventListener('click', async () => {
    actionSection.classList.add('hidden');
    cachedCompanyNames = null;

    await chrome.tabs.query(
      { active: true, currentWindow: true },
      async (tabs) => {
        const tab = tabs[0];
        if (tab) {
          const url = new URL(tab.url);
          sourceInput.value = getWebsiteHostDisplayName(url.host);
        }
      }
    );
    logApplicationSection.classList.remove('hidden');
    resizePopup();
  });

  submitApplicationButton.addEventListener('click', async () => {
    const city = cityInput.value;
    const companyDesirability = companyDesirabilityInput.value;
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
                  ...(city && { city }),
                  ...(companyDesirability && { companyDesirability }),
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
        'sponsorship?',
        'need sponsorship',
        'require work sponsorship',
        'sponsorship required',
        'work visa sponsorship',
        'work authorization sponsorship',
        'job sponsorship',
        'employment sponsorship',
        'require visa sponsorship',
        'requires visa sponsorship',
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
          const ariaLabel = input
            .getAttribute('aria-label')
            ?.trim()
            .toLowerCase();

          aliases.forEach((alias) => {
            if (placeholder && placeholder.includes(alias)) {
              fillInputField(input, value);
            } else if (nameAttr && nameAttr.includes(alias)) {
              fillInputField(input, value);
            } else if (idAttr && idAttr.includes(alias)) {
              fillInputField(input, value);
            } else if (ariaLabel && ariaLabel.includes(alias)) {
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
