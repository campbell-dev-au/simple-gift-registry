Feature: View homepage
  As a visitor
  I want to land on a page that identifies the site as the Gift Registry
  So that I know I've reached the right app before I start using it

  Scenario: Visitor loads the homepage
    Given I visit the homepage
    Then I see a heading that says "Gift Registry"
