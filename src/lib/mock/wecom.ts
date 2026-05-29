export const MOCK_WECOM_CUSTOMERS = [
  { externalUserid: "mock_ext_001", name: "张三", phone: "13800001001" },
  { externalUserid: "mock_ext_002", name: "李四", phone: "13800001002" },
  { externalUserid: "mock_ext_003", name: "王五", phone: "13800001003" },
  { externalUserid: "mock_ext_004", name: "赵六", phone: "13800001004" },
];

export function searchMockCustomers(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_WECOM_CUSTOMERS;
  return MOCK_WECOM_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.externalUserid.includes(q),
  );
}

export function getMockCustomer(externalUserid: string) {
  return MOCK_WECOM_CUSTOMERS.find((c) => c.externalUserid === externalUserid);
}
