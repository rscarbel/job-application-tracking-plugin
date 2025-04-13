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
    currentLocation: `${personalInfo.city || ''}, ${personalInfo.state || ''}`,
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
