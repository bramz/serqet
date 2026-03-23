package api

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

func UploadHandler(c fiber.Ctx) error {
    file, err := c.FormFile("file")
    if err != nil { return c.Status(400).JSON(fiber.Map{"error": "No file"}) }

    uploadDir := "./uploads"
    os.MkdirAll(uploadDir, 0755)

    filename := uuid.New().String() + filepath.Ext(file.Filename)
    savePath := filepath.Join(uploadDir, filename)

    if err := c.SaveFile(file, savePath); err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Save failed"})
    }

    absPath, _ := filepath.Abs(savePath)

    return c.JSON(fiber.Map{
        "url":      fmt.Sprintf("/uploads/%s", filename),
        "path":     absPath,
        "filename": filename,
    })
}