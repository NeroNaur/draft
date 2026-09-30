/* ARCH prototype: the one list of HAU colleges and their departments / programs.
   Every page (catalog filters, search results, upload forms, URO pages) reads from here.
   Sources: hau.edu.ph program pages (School of Computing, SEA, SAS, SNAMS, SHTM, CCJEF,
   HAU Aviation Institute, Basic Education) as of 2026. */
(function () {
  var COLLEGES = {
    "School of Business and Accountancy": ["Accountancy", "Management Accounting", "Business Administration", "Business Economics",
      "Financial Management", "Human Resource Management", "Marketing Management", "Legal Management"],
    "School of Engineering and Architecture": ["Aeronautical Engineering", "Architecture", "Civil Engineering", "Computer Engineering",
      "Electrical Engineering", "Electronics Engineering", "Industrial Engineering", "Mechanical Engineering"],
    "School of Arts and Sciences": ["Communication", "Psychology"],
    "School of Education": ["Elementary Education", "Secondary Education"],
    "School of Hospitality and Tourism Management": ["Hospitality Management", "Tourism Management"],
    "School of Nursing and Allied Medical Sciences": ["Nursing", "Medical Technology", "Radiologic Technology"],
    "School of Computing": ["Computer Science", "Information Technology", "Information Systems", "Entertainment and Multimedia Computing"],
    "College of Criminal Justice Education and Forensics": ["Criminology", "Forensic Science"],
    "HAU Aviation Institute": ["Aviation Management"],
    "Basic Education": ["Preschool", "Grade School", "Junior High School", "Senior High School (STEM)", "Senior High School (ABM)",
      "Senior High School (HUMSS)", "Senior High School (GAS)", "Senior High School (TVL-HE)"]
  };
  var NAMES = Object.keys(COLLEGES);

  // Year range used by every year filter (newest first)
  var FIRST_YEAR = 2000, LAST_YEAR = 2026;
  var YEARS = [];
  for (var y = LAST_YEAR; y >= FIRST_YEAR; y--) YEARS.push(String(y));

  function collegeOf(dept) {
    for (var c in COLLEGES) if (COLLEGES[c].indexOf(dept) > -1) return c;
    return "";
  }
  function departments(college) {
    if (college) return (COLLEGES[college] || []).slice();
    return NAMES.reduce(function (all, c) { return all.concat(COLLEGES[c]); }, []);
  }
  // Fill a <select> with departments grouped by college (only `college` if given), keeping `keep` selected
  function fillDepartments(select, college, keep, placeholder) {
    select.innerHTML = "";
    if (placeholder !== null) select.add(new Option(placeholder || "All departments", ""));
    (college ? [college] : NAMES).forEach(function (c) {
      var g = document.createElement("optgroup"); g.label = c;
      COLLEGES[c].forEach(function (d) { g.appendChild(new Option(d, d)); });
      select.appendChild(g);
    });
    select.value = keep && departments(college).indexOf(keep) > -1 ? keep : "";
  }
  function fillColleges(select, keep, placeholder) {
    select.innerHTML = "";
    if (placeholder !== null) select.add(new Option(placeholder || "All colleges", ""));
    NAMES.forEach(function (c) { select.add(new Option(c, c)); });
    select.value = keep || "";
  }
  function fillYears(select, keep, placeholder) {
    select.innerHTML = "";
    if (placeholder) select.add(new Option(placeholder, ""));
    YEARS.forEach(function (y) { select.add(new Option(y, y)); });
    select.value = keep || (placeholder ? "" : YEARS[0]);
  }

  window.ARCH_COLLEGES = { map: COLLEGES, names: NAMES, years: YEARS, firstYear: FIRST_YEAR, lastYear: LAST_YEAR,
    collegeOf: collegeOf, departments: departments, fillDepartments: fillDepartments, fillColleges: fillColleges, fillYears: fillYears };
})();
