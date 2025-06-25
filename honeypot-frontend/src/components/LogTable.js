import React from 'react';
import { Table, Text, Title, Paper, ScrollArea } from '@mantine/core';

function LogTable({ logs }) {
  return (
    <Paper
      p="md"
      shadow="sm"
      radius="md"
      withBorder
      style={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '60vh',
        overflow: 'hidden',
      }}
    >
      <Title order={3} mb="sm" c="brand.7">
        🛡️ Honeypot Activity Logs
      </Title>

      {logs.length === 0 ? (
        <Text c="dimmed" ta="center" mt="md">
          No security events detected yet
        </Text>
      ) : (
        <ScrollArea type="always" offsetScrollbars>
          <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders
            verticalSpacing="sm"
            style={{
              minWidth: 800,     // ✅ ключевая правка
              width: '100%',
              tableLayout: 'auto',
            }}
            styles={{
              th: {
                border: '2px solid #e9ecef',
                backgroundColor: '#f8f9fa',
                padding: '12px 16px',
                whiteSpace: 'nowrap',
              },
              td: {
                border: '1px solid #e9ecef',
                padding: '10px 16px',
                verticalAlign: 'top',
                wordBreak: 'break-word',
              },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>IP Address</Table.Th>
                <Table.Th>Port</Table.Th>
                <Table.Th>Method</Table.Th>
                <Table.Th>Path</Table.Th>
                <Table.Th>User Agent</Table.Th>
                <Table.Th>Timestamp</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {logs.map((log, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{log.id}</Table.Td>
                  <Table.Td>{log.ip}</Table.Td>
                  <Table.Td>{log.port}</Table.Td>
                  <Table.Td>{log.method}</Table.Td>
                  <Table.Td>{log.url}</Table.Td>
                  <Table.Td>{log.user_agent}</Table.Td>
                  <Table.Td>
                    {new Date(log.timestamp).toLocaleString('ru-RU')}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Paper>
  );
}

export default LogTable;
