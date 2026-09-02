#!/usr/bin/env python3
"""Fix the corrupted className attributes in AdminDashboard.tsx"""

with open('src/components/AdminDashboard.tsx', 'r') as f:
    content = f.read()

replacements = [
    (
        '                    className={}\n                    title="Only Loot Deals"',
        '                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1 \${lootOnly ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}\n                    title="Only Loot Deals"'
    ),
    (
        '                    className={}\n                    title="Only Verified Deals"',
        '                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1 \${verifiedOnly ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}\n                    title="Only Verified Deals"'
    ),
    (
        '                    className={}\n                    title="Only Deals with Coupon Codes"',
        '                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1 \${couponOnly ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}\n                    title="Only Deals with Coupon Codes"'
    ),
]

for old, new in replacements:
    if old not in content:
        print(f"WARNING: Could not find pattern for replacement")
        continue
    content = content.replace(old, new, 1)
    print("Replaced one className")

with open('src/components/AdminDashboard.tsx', 'w') as f:
    f.write(content)

print("Done fixing className attributes")
