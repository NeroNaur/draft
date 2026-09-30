/* ARCH prototype: temporary account "database".
   There is no server; these accounts only exist in this file.
   The two logins use SEPARATE accounts:

   1) Knimbus accounts  - the person's own HAU / Knimbus SSO account (login.html).
      General authorized users (view only). Students and faculty both open the
      General User View (catalog.html).

   2) System accounts   - issued by the URO admin (system-login.html).
      role "faculty"    -> faculty proposal pages (faculty-catalog.html)
      role "uro"        -> URO admin view (not built yet)
      role "instructor" -> thesis instructor / uploader view (not built yet)
*/
window.ARCH_KNIMBUS_ACCOUNTS = [
  { email: "ktsicat1@student.hau.edu.ph", password: "arch2026", name: "Kurt Sicat",       initials: "KS", role: "Student" },
  { email: "r.figueroa@hau.edu.ph",       password: "arch2026", name: "Richard Figueroa", initials: "RF", role: "Faculty" }
];

window.ARCH_SYSTEM_ACCOUNTS = [
  { email: "apsarmiento@hau.edu.ph",  password: "arch2026", name: "Adrian Sarmiento",  firstName: "Adrian",  initials: "AS", role: "faculty",    label: "Faculty" },
  { email: "mcvillanueva@hau.edu.ph", password: "arch2026", name: "Martin Villanueva", firstName: "Martin",  initials: "MV", role: "uro",        label: "URO Admin" },
  { email: "kgtienzo@hau.edu.ph",     password: "arch2026", name: "Krisean Tienzo",    firstName: "Krisean", initials: "KT", role: "instructor", label: "Thesis Instructor" }
];
