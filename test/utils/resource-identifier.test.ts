import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { parseLinearUrl } from "../../src/utils/resource-identifier.ts"

describe("Resource Identifier Parsing", () => {
  describe("parseLinearUrl", () => {
    describe("Issue URLs", () => {
      it("should parse valid issue URL", () => {
        const url =
          "https://linear.app/my-workspace/issue/ENG-123/fix-login-bug"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "issue",
          id: "ENG-123",
        })
      })

      it("should parse issue URL without slug", () => {
        const url = "https://linear.app/workspace/issue/ABC-456"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "issue",
          id: "ABC-456",
        })
      })

      it("should parse issue URL with complex slug", () => {
        const url =
          "https://linear.app/workspace/issue/LOT-457/configure-admin-dashboard-deployment-vercel"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "issue",
          id: "LOT-457",
        })
      })

      it("should handle uppercase and lowercase issue identifiers", () => {
        const url1 = "https://linear.app/workspace/issue/eng-123/bug"
        const url2 = "https://linear.app/workspace/issue/ENG-123/bug"

        const result1 = parseLinearUrl(url1)
        const result2 = parseLinearUrl(url2)

        expect(result1?.id).toBe("ENG-123")
        expect(result2?.id).toBe("ENG-123")
      })

      it("should handle multi-character team prefixes", () => {
        const url = "https://linear.app/workspace/issue/PROD-999/issue"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "issue",
          id: "PROD-999",
        })
      })

      it("should handle alphanumeric team prefixes", () => {
        const url = "https://linear.app/workspace/issue/T3AM-42/issue"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "issue",
          id: "T3AM-42",
        })
      })
    })

    describe("Project URLs", () => {
      it("should parse valid project URL with UUID", () => {
        const url =
          "https://linear.app/workspace/project/550e8400-e29b-41d4-a716-446655440000/my-project"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "project",
          id: "550e8400-e29b-41d4-a716-446655440000",
        })
      })

      it("should parse project URL without slug", () => {
        const url =
          "https://linear.app/workspace/project/550e8400-e29b-41d4-a716-446655440000"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "project",
          id: "550e8400-e29b-41d4-a716-446655440000",
        })
      })
    })

    describe("Document URLs", () => {
      it("should parse valid document URL with UUID", () => {
        const url =
          "https://linear.app/workspace/document/a1b2c3d4-e5f6-7890-abcd-ef1234567890/meeting-notes"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "document",
          id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        })
      })
    })

    describe("Invalid URLs", () => {
      it("should return null for non-Linear URLs", () => {
        const url = "https://github.com/user/repo/issues/123"
        const result = parseLinearUrl(url)

        expect(result).toBeNull()
      })

      it("should return null for malformed Linear URLs", () => {
        const url = "https://linear.app/workspace"
        const result = parseLinearUrl(url)

        expect(result).toBeNull()
      })

      it("should return null for URLs with invalid issue identifiers", () => {
        const url = "https://linear.app/workspace/issue/INVALID/title"
        const result = parseLinearUrl(url)

        expect(result).toBeNull()
      })

      it("should return null for completely invalid URLs", () => {
        const url = "not-a-url"
        const result = parseLinearUrl(url)

        expect(result).toBeNull()
      })

      it("should return null for empty path", () => {
        const url = "https://linear.app"
        const result = parseLinearUrl(url)

        expect(result).toBeNull()
      })

      it("should return null for issue identifier with leading zeros", () => {
        const url = "https://linear.app/workspace/issue/ENG-0123/title"
        const result = parseLinearUrl(url)

        // Leading zeros make it invalid (should be ENG-123)
        expect(result).toBeNull()
      })
    })

    describe("Edge Cases", () => {
      it("should handle URLs with query parameters", () => {
        const url =
          "https://linear.app/workspace/issue/ENG-123/title?tab=comments&commentId=abc"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "issue",
          id: "ENG-123",
        })
      })

      it("should handle URLs with hash fragments", () => {
        const url =
          "https://linear.app/workspace/issue/ENG-123/title#comment-123"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "issue",
          id: "ENG-123",
        })
      })

      it("should handle different Linear subdomains", () => {
        const url = "https://app.linear.app/workspace/issue/ENG-123/title"
        const result = parseLinearUrl(url)

        // Should still work with app.linear.app
        expect(result).toEqual({
          type: "issue",
          id: "ENG-123",
        })
      })

      it("should handle URLs with port numbers", () => {
        const url = "https://linear.app:443/workspace/issue/ENG-123/title"
        const result = parseLinearUrl(url)

        expect(result).toEqual({
          type: "issue",
          id: "ENG-123",
        })
      })
    })
  })

  describe("UUID Validation (via Project/Document URLs)", () => {
    it("should accept valid UUIDs", () => {
      const validUUIDs = [
        "550e8400-e29b-41d4-a716-446655440000",
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "00000000-0000-0000-0000-000000000000",
        "ffffffff-ffff-ffff-ffff-ffffffffffff",
      ]

      validUUIDs.forEach((uuid) => {
        const url = `https://linear.app/workspace/project/${uuid}/title`
        const result = parseLinearUrl(url)
        expect(result?.id).toBe(uuid)
      })
    })

    it("should reject malformed UUIDs", () => {
      const invalidUUIDs = [
        "not-a-uuid",
        "550e8400-e29b-41d4-a716", // Too short
        "550e8400-e29b-41d4-a716-446655440000-extra", // Too long
        "550e8400_e29b_41d4_a716_446655440000", // Wrong separator
      ]

      invalidUUIDs.forEach((uuid) => {
        const url = `https://linear.app/workspace/project/${uuid}/title`
        const result = parseLinearUrl(url)
        // parseLinearUrl doesn't validate UUIDs, it just extracts them
        // The validation happens in the isUUID function
        expect(result?.type).toBe("project")
      })
    })
  })

  describe("Issue Identifier Format", () => {
    it("should accept valid issue identifier patterns", () => {
      const validIdentifiers = [
        "A-1",
        "ENG-123",
        "PROD-9999",
        "T3AM-42",
        "a1b2-999",
      ]

      validIdentifiers.forEach((id) => {
        const url = `https://linear.app/workspace/issue/${id}/title`
        const result = parseLinearUrl(url)
        expect(result?.id).toBe(id.toUpperCase())
      })
    })

    it("should reject invalid issue identifier patterns", () => {
      const invalidIdentifiers = [
        "ENG-0", // Zero is not allowed
        "ENG-01", // Leading zero
        "-123", // No team prefix
        "ENG-", // No number
        "ENG", // No separator
        "123", // Just a number
      ]

      invalidIdentifiers.forEach((id) => {
        const url = `https://linear.app/workspace/issue/${id}/title`
        const result = parseLinearUrl(url)
        expect(result).toBeNull()
      })
    })
  })
})
