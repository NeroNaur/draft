/* ARCH prototype: the repository documents that have a detail page (detail.html?doc=<id>).
   Demo only: every document opens the same PDF (the Group 4 capstone manuscript, "cidr-2025"),
   so the viewer can be shown for any title. Only "cidr-2025" matches that PDF. */
(function () {
  var PDF = "cidr-2025";
  var D = {
    "cidr-2025": { title: "A Web-Based Centralized Institutional Digital Repository for Academic Research Management at Holy Angel University",
      type: "Capstone Project", year: "2026", college: "School of Computing", department: "Information Technology",
      authors: "Sarmiento, Adrian P.; Sicat, Kurt Justine T.; Tienzo, Krisean G.; Villanueva, Martin Conrad S.",
      keywords: "Institutional repository; Research management; Dublin Core; Knimbus SSO",
      abstract: "The University Research Office (URO) of Holy Angel University currently manages the submission, evaluation, and storage of academic research outputs — including faculty research papers, undergraduate theses, and capstone projects — through an email-based process with documents stored in a restricted SharePoint repository. This manual, email-driven workflow limits centralized tracking of submission status and prevents students, faculty, and other members of the HAU community from directly searching or accessing approved research outputs. This study proposes the development of a Web-Based Centralized Institutional Digital Repository for Academic Research Management, a web-based application built using React, Supabase (PostgreSQL), and Knimbus single sign-on (SSO) authentication. The proposed system provides three levels of role-based access — administrative personnel, authorized uploaders, and general authorized users — supporting a structured document submission and approval workflow, Dublin Core metadata-based cataloging, multi-criteria search and filtering, and in-browser document viewing. The system was developed following the Prototyping Model, allowing iterative refinement based on feedback from the URO and target users. To evaluate the proposed system, a total of 364 participants — 361 end-users (URO staff, thesis instructors and coordinators, faculty members, and students with research involvement) selected through purposive and proportional stratified sampling, and 3 IT experts selected through expert sampling — took part in usability testing and technical evaluation. End-user perceptions of usability were measured using the System Usability Scale (SUS), while IT experts evaluated the system's technical quality using an ISO/IEC 25010-based instrument across five quality characteristics: Functional Suitability, Usability, Reliability, Performance Efficiency, and Security. Findings from this evaluation are intended to determine the system's readiness to support centralized, secure, and accessible research output management at Holy Angel University." },
    "enroll": { title: "Design and Implementation of a Web-Based Enrollment Analytics Dashboard for Higher Education Institutions",
      type: "Capstone Project", year: "2025", college: "College of Computing Studies", department: "Information Technology",
      authors: "Dela Cruz, Juan P.; Santos, Maria L.", keywords: "Enrollment; Analytics; Higher education",
      abstract: "This capstone project develops a dashboard that helps registrars monitor enrollment trends and forecast section demand." },
    "nursing": { title: "Effects of Simulation-Based Learning on the Clinical Competence of Nursing Students",
      type: "Thesis", year: "2024", college: "College of Allied Health Studies", department: "Nursing",
      authors: "Garcia, Angelica R.", keywords: "Simulation-based learning; Clinical competence; Nursing education",
      abstract: "This thesis compares the clinical competence of nursing students trained with high-fidelity simulation against those trained through traditional return demonstration." },
    "seismic": { title: "Seismic Performance of Low-Rise Reinforced Concrete Buildings in Central Luzon",
      type: "Thesis", year: "2024", college: "College of Engineering and Architecture", department: "Civil Engineering",
      authors: "Mendoza, Rafael T.; Villanueva, Carla S.", keywords: "Seismic performance; Reinforced concrete; Central Luzon",
      abstract: "This thesis assesses how typical low-rise reinforced concrete buildings in Central Luzon would perform during a strong earthquake." },
    "finlit": { title: "Financial Literacy and Small Enterprise Sustainability in Pampanga",
      type: "Faculty Research", year: "2023", college: "College of Business and Accountancy", department: "Business Administration",
      authors: "Bautista, Erlinda M.", keywords: "Financial literacy; Small enterprises; Sustainability",
      abstract: "This study examines how financial literacy relates to the long-term survival of micro and small enterprises." },
    "teacher": { title: "Teacher Digital Competence and Student Engagement in Blended Classrooms",
      type: "Dissertation", year: "2022", college: "College of Education", department: "Education",
      authors: "Tolentino, Grace A.", keywords: "Digital competence; Student engagement; Blended learning",
      abstract: "A mixed-methods dissertation on how teacher digital skills shape student engagement in blended learning." },
    "weaving": { title: "Traditional Kapampangan Weaving Techniques: A Documentation",
      type: "Faculty Research", year: "2025", college: "School of Arts and Sciences", department: "Communication",
      authors: "Pineda, Lourdes M.", keywords: "Kapampangan culture; Weaving; Documentation",
      abstract: "This study documents the materials, patterns and steps used by Kapampangan weavers, based on interviews and field observation." },
    "bsba": { title: "Employability of BSBA Graduates of HAU, Batch 2023",
      type: "Thesis", year: "2024", college: "School of Business and Accountancy", department: "Business Administration",
      authors: "Reyes, Mark Anthony L.; Cruz, Jenny R.", keywords: "Employability; Graduate tracer; Business administration",
      abstract: "A tracer study of HAU's 2023 BSBA graduates, looking at how quickly they found work and how well their jobs match their degree." },
    "ofw": { title: "Financial Resilience of OFW Families in Pampanga",
      type: "Faculty Research", year: "2026", college: "School of Business and Accountancy", department: "Accountancy",
      authors: "Sarmiento, Adrian P.", keywords: "OFW families; Financial resilience; Remittances",
      abstract: "This study looks at how families of overseas Filipino workers in Pampanga manage remittances and prepare for financial shocks." },
    "socmed": { title: "Social Media Marketing Practices of Small Food Businesses in Angeles City",
      type: "Thesis", year: "2026", college: "School of Business and Accountancy", department: "Marketing Management",
      authors: "Tan, Bianca L.; Mercado, John Carlo P.", keywords: "Social media marketing; Food businesses; MSMEs",
      abstract: "This thesis describes how small food businesses in Angeles City use social media to reach customers and which practices relate to higher sales." }
  };
  Object.keys(D).forEach(function (k) { D[k].id = k; D[k].pdf = PDF; });
  window.ARCH_DOCUMENTS = { all: D, get: function (id) { return D[id] || D[PDF]; }, url: function (id) { return "detail.html?doc=" + encodeURIComponent(id); } };
})();
