import { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, notification } from 'antd'

const { Option } = Select

/**
 * Reusable Edit Modal Component for Master Settings
 * 
 * @param {Object} props
 * @param {boolean} props.open - Modal open state
 * @param {Object|null} props.record - Record data to edit (null when closed)
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onSuccess - Callback when update succeeds
 * @param {Function} props.onUpdate - API function to call for update (async)
 * @param {Array} props.fields - Array of field configurations
 * @param {string} props.title - Modal title
 * @param {string} props.successMessage - Success notification message
 */
export default function MasterEditModal({
  open,
  record,
  onClose,
  onSuccess,
  onUpdate,
  fields = [],
  title = 'Edit Master Details',
  successMessage = 'Updated successfully'
}) {
  const [form] = Form.useForm()
  const [isSaving, setIsSaving] = useState(false)

  // Pre-fill form when record changes
  useEffect(() => {
    if (open && record) {
      form.setFieldsValue(record)
    } else {
      form.resetFields()
    }
  }, [open, record, form])

  const handleSubmit = async () => {
    try {
      // Validate form
      const values = await form.validateFields()
      setIsSaving(true)

      // Call update API
      await onUpdate(record.id, values)

      // Show success notification
      notification.success({
        message: 'Success',
        description: successMessage,
        placement: 'topRight'
      })

      // Close modal and refresh data
      form.resetFields()
      onSuccess()
      onClose()
    } catch (error) {
      // Handle validation errors (form validation)
      if (error.errorFields) {
        return // Form validation errors are handled by Ant Design
      }

      // Handle API errors
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to update. Please try again.',
        placement: 'topRight'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  const renderField = (field) => {
    const { name, label, type, options, disabled, rules, placeholder } = field

    switch (type) {
      case 'select':
        return (
          <Select placeholder={placeholder || `Select ${label}`} allowClear>
            {options?.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        )

      case 'textarea':
        return <Input.TextArea placeholder={placeholder || `Enter ${label}`} rows={4} />

      default:
        return <Input placeholder={placeholder || `Enter ${label}`} disabled={disabled} />
    }
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={isSaving}
      destroyOnClose
      maskClosable
      keyboard
      okText="Save"
      cancelText="Cancel"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 24 }}
      >
        {fields.map((field) => (
          <Form.Item
            key={field.name}
            label={field.label}
            name={field.name}
            rules={field.rules || []}
          >
            {renderField(field)}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  )
}

