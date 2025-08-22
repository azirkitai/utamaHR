#!/bin/bash

# Array of Malay to English replacements
declare -A replacements=(
    ["Pemohon"]="Applicant"
    ["Lulus"]="Approve" 
    ["Tolak"]="Reject"
    ["Pekerja"]="Employee"
    ["Syarikat"]="Company"
    ["Cuti"]="Leave"
    ["Tuntutan"]="Claim"
    ["Permohonan"]="Application"
    ["Kelulusan"]="Approval"
    ["Penolakan"]="Rejection"
    ["Had"]="Limit"
    ["Tahunan"]="Annual"
    ["Setiap"]="Each"
    ["Tanpa had"]="No limit"
    ["Memproses"]="Processing"
    ["Lewat"]="Late"
    ["minit"]="minutes"
    ["jam"]="hours"
    ["semakan"]="review"
    ["penyelia"]="supervisor"
    ["rehat"]="break"
    ["balik"]="return"
    ["dari masa"]="from"
    ["Perlu"]="Needs"
    ["masa shift"]="shift time"
    ["masa balik rehat"]="break return time"
    ["Lihat Maklumat"]="View Details"
    ["Diluluskan"]="Approved"
    ["Ditolak"]="Rejected"
    ["Menunggu"]="Pending"
    ["Nama Pekerja"]="Employee Name"
    ["Tarikh"]="Date"
    ["Jam Masuk"]="Clock In"
    ["Jam Keluar"]="Clock Out"
    ["Status"]="Status"
    ["Laporan Kehadiran"]="Attendance Report"
    ["LAPORAN LENGKAP PEKERJA"]="COMPLETE EMPLOYEE REPORT"
    ["MAKLUMAT PERHUBUNGAN"]="CONTACT INFORMATION"
    ["MAKLUMAT KECEMASAN"]="EMERGENCY INFORMATION"
    ["MAKLUMAT HR/PAYROLL"]="HR/PAYROLL INFORMATION"
    ["Telefon Pejabat"]="Office Phone"
    ["Telefon Bimbit"]="Mobile Phone"
    ["Email Rasmi"]="Official Email"
    ["Email Peribadi"]="Personal Email"
    ["Nama Untuk Dihubungi"]="Emergency Contact Name"
    ["No. Telefon Kecemasan"]="Emergency Phone Number"
    ["Hubungan"]="Relationship"
    ["Gaji Asas"]="Basic Salary"
    ["Nama Bank"]="Bank Name"
    ["No. Akaun Bank"]="Bank Account Number"
    ["No. KWSP"]="EPF Number"
    ["No. SOCSO"]="SOCSO Number"
    ["No. EIS"]="EIS Number"
    ["No. PCB"]="PCB Number"
    ["TIDAK DIKETAHUI"]="UNKNOWN"
    ["DIJANA"]="GENERATED"
    ["Halaman"]="Page"
    ["daripada"]="of"
    ["Semua"]="All"
    ["Pekerja Aktif"]="Active Employee"
    ["Pekerja Dalam Percubaan"]="Employee on Probation"
    ["Pekerja Berhenti"]="Terminated Employee"
    ["PECAHAN MENGIKUT JABATAN"]="BREAKDOWN BY DEPARTMENT"
    ["orang"]="people"
    ["Permohonan Cuti"]="Leave Application"
    ["Nama"]="Name"
    ["Jenis Cuti"]="Leave Type"
    ["Tarikh Mula"]="Start Date"
    ["Tarikh Akhir"]="End Date"
    ["Hari"]="Days"
    ["Tiada rekod kehadiran dijumpai untuk tempoh tarikh yang dipilih"]="No attendance records found for the selected date range"
    ["KLINIK UTAMA 24 JAM HR SISTEM"]="UTAMA 24 HOUR CLINIC HR SYSTEM"
)

# Function to replace text in files
replace_in_files() {
    local search_term="$1"
    local replace_term="$2"
    
    # Find all TypeScript and TSX files in client and server directories
    find client server -name "*.ts" -o -name "*.tsx" | while read -r file; do
        if [ -f "$file" ]; then
            # Use sed to replace text
            sed -i.bak "s/$search_term/$replace_term/g" "$file" 2>/dev/null || true
            # Remove backup file if replacement was successful
            [ -f "$file.bak" ] && rm "$file.bak"
        fi
    done
}

# Perform replacements
echo "Starting Malay to English translation..."
for malay in "${!replacements[@]}"; do
    english="${replacements[$malay]}"
    echo "Replacing '$malay' with '$english'"
    replace_in_files "$malay" "$english"
done

echo "Translation completed!"
