import { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, notification } from 'antd'

const { Option } = Select

/**
 * Reusable Add/Edit Modal Component for Master Settings
 * 
 * @param {Object} props
 * @param {boolean} props.open - Modal open state
 * @param {Object|null} props.record - Record data to edit (null for Add mode)
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onSuccess - Callback when create/update succeeds
 * @param {Function} props.onUpdate - API function to call for update (async) - required for Edit mode
 * @param {Function} props.onCreate - API function to call for create (async) - required for Add mode
 * @param {Array} props.fields - Array of field configurations
 * @param {string} props.title - Modal title (will show "Add" or "Edit" prefix if not provided)
 * @param {string} props.successMessage - Success notification message
 */
export default function MasterEditModal({
  open,
  record,
  onClose,
  onSuccess,
  onUpdate,
  onCreate,
  fields = [],
  title,
  successMessage
}) {
  const [form] = Form.useForm()
  const [isSaving, setIsSaving] = useState(false)

  const isEditMode = !!record
  const modalTitle = title || (isEditMode ? 'Edit' : 'Add')
  const defaultSuccessMessage = isEditMode ? 'Updated successfully' : 'Created successfully'
  const finalSuccessMessage = successMessage || defaultSuccessMessage

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

      if (isEditMode) {
        // Edit mode: call update API
        if (!onUpdate) {
          throw new Error('onUpdate function is required for edit mode')
        }
        await onUpdate(record.id, values)
      } else {
        // Add mode: call create API
        if (!onCreate) {
          throw new Error('onCreate function is required for add mode')
        }
        await onCreate(values)
      }

      // Show success notification
      notification.success({
        message: 'Success',
        description: finalSuccessMessage,
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
        description: error.message || (isEditMode ? 'Failed to update. Please try again.' : 'Failed to create. Please try again.'),
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
      okText={isEditMode ? 'Save' : 'Create'}
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

